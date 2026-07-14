import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireAdmin, isAdmin, isClubCoordinator, isClubLead, requireIdentity, apiError, handleAuthError } from '@/lib/permissions'
import { resolveActiveMembers } from '@/lib/members'

// GET /api/clubs - List all clubs (enriched with the requester's permission flags)
export async function GET() {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()
    const me = requireIdentity(session)

    const clubs = await db.collection('clubs').find({ department: session.user.department }).sort({ createdAt: -1 }).toArray()

    const enrichedClubs = await Promise.all(
      clubs.map(async club => {
        const announcements = await db
          .collection('announcements')
          .find({ scope: 'club', clubId: club._id.toString() })
          .project({ _id: 1 })
          .toArray()
        const announcementIds = announcements.map(a => a._id.toString())

        const unreadCount = await db.collection('notifications').countDocuments({
          'recipient.id': me.id,
          'recipient.collection': me.collection,
          type: 'club',
          referenceId: { $in: announcementIds },
          isRead: false,
        })

        return {
          ...club,
          isCoordinator: isClubCoordinator(club, session),
          isLead: isClubLead(club, session),
          isMember: club.members?.some(m => m.id === me.id && m.collection === me.collection),
          isAdmin: isAdmin(session),
          unreadCount,
        }
      })
    )

    return NextResponse.json(enrichedClubs)
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/clubs - Create a new club (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { name, description, facultyCoordinatorRef, studentLeadRef, memberRefs } = body

    if (!name) return apiError('Club name is required', 400)

    let facultyCoordinator = null
    if (facultyCoordinatorRef?.id) {
      const teacher = await db.collection('teachers').findOne({ _id: new ObjectId(facultyCoordinatorRef.id), status: 'active' })
      if (teacher) facultyCoordinator = { id: teacher._id.toString(), name: teacher.name, email: teacher.email }
    }

    let studentLead = null
    if (studentLeadRef?.id) {
      const student = await db.collection('students').findOne({ _id: new ObjectId(studentLeadRef.id), status: 'active' })
      if (student) studentLead = { id: student._id.toString(), name: student.name, email: student.email }
    }

    const members = await resolveActiveMembers(db, memberRefs)

    const now = new Date()
    const club = {
      name: name.trim(),
      description: description?.trim() || '',
      department: session.user.department,
      bannerImage: null,
      logo: null,
      facultyCoordinator,
      studentLead,
      members,
      createdBy: { id: session.user.id, email: session.user.email, name: session.user.name },
      createdAt: now,
      updatedAt: now,
    }

    const { insertedId } = await db.collection('clubs').insertOne(club)
    const created = await db.collection('clubs').findOne({ _id: insertedId })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}
