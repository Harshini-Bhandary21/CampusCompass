import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireAdmin, isAdmin, isClubCoordinator, isClubLead, apiError, handleAuthError } from '@/lib/permissions'
import { resolveActiveMembers } from '@/lib/members'

// GET /api/clubs/[id] - Get a single club
export async function GET(request, { params }) {
  try {
    await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const club = await db.collection('clubs').findOne({ _id: new ObjectId(id) })
    if (!club) return apiError('Club not found', 404)

    return NextResponse.json(club)
  } catch (error) {
    return handleAuthError(error)
  }
}

// PUT /api/clubs/[id] - Update a club (Admin full; coordinator sets lead+logo; lead sets logo only)
export async function PUT(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const body = await request.json()
    const { name, description, facultyCoordinatorRef, studentLeadRef, memberRefs, logo } = body

    const club = await db.collection('clubs').findOne({ _id: new ObjectId(id) })
    if (!club) return apiError('Club not found', 404)

    const isSysAdmin = isAdmin(session)
    const isCoordinator = session.user.role === 'teacher' && isClubCoordinator(club, session)
    const isLead = session.user.role === 'student' && isClubLead(club, session)

    if (!isSysAdmin && !isCoordinator && !isLead) {
      return apiError('Not authorized', 403)
    }

    const update = { updatedAt: new Date() }

    if (isSysAdmin) {
      if (name) update.name = name.trim()
      if (description !== undefined) update.description = description.trim()

      if (facultyCoordinatorRef !== undefined) {
        if (facultyCoordinatorRef?.id) {
          const teacher = await db.collection('teachers').findOne({ _id: new ObjectId(facultyCoordinatorRef.id), status: 'active' })
          update.facultyCoordinator = teacher ? { id: teacher._id.toString(), name: teacher.name, email: teacher.email } : null
        } else {
          update.facultyCoordinator = null
        }
      }

      if (studentLeadRef !== undefined) {
        if (studentLeadRef?.id) {
          const student = await db.collection('students').findOne({ _id: new ObjectId(studentLeadRef.id), status: 'active' })
          update.studentLead = student ? { id: student._id.toString(), name: student.name, email: student.email } : null
        } else {
          update.studentLead = null
        }
      }

      if (memberRefs) update.members = await resolveActiveMembers(db, memberRefs)
      if (logo !== undefined) update.logo = logo
    } else if (isCoordinator) {
      if (studentLeadRef !== undefined) {
        if (studentLeadRef?.id) {
          const student = await db.collection('students').findOne({ _id: new ObjectId(studentLeadRef.id), status: 'active' })
          update.studentLead = student ? { id: student._id.toString(), name: student.name, email: student.email } : null
        } else {
          update.studentLead = null
        }
      }
      if (logo !== undefined) update.logo = logo
    } else if (isLead) {
      if (logo !== undefined) update.logo = logo
    }

    await db.collection('clubs').updateOne({ _id: new ObjectId(id) }, { $set: update })

    const updated = await db.collection('clubs').findOne({ _id: new ObjectId(id) })
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/clubs/[id] - Delete a club and its announcements (Admin only)
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const club = await db.collection('clubs').findOne({ _id: new ObjectId(id) })
    if (!club) return apiError('Club not found', 404)

    await db.collection('announcements').deleteMany({ clubId: id, scope: 'club' })
    await db.collection('clubs').deleteOne({ _id: new ObjectId(id) })

    return NextResponse.json({ message: 'Club and its announcements deleted successfully' })
  } catch (error) {
    return handleAuthError(error)
  }
}
