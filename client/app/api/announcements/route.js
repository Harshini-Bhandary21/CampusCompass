import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import {
  requireAuth,
  isAdmin,
  isTeacher,
  isClubCoordinator,
  isClubLead,
  identityOf,
  requireIdentity,
  apiError,
  handleAuthError,
} from '@/lib/permissions'
import { validateAttachmentSizes } from '@/lib/attachments'
import { resolveTargetRecipients, insertNotifications } from '@/lib/notify'

// GET /api/announcements - List announcements
export async function GET(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')
    const scope = searchParams.get('scope') || 'global'
    const clubId = searchParams.get('clubId')
    const skip = (page - 1) * limit

    const now = new Date()
    const notExpired = { $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }] }

    let query
    if (scope === 'club' && clubId) {
      query = { $and: [notExpired, { scope: 'club', clubId }] }
    } else {
      const deptFilter = { department: session.user.department }
      if (isAdmin(session)) {
        query = { $and: [notExpired, { scope: 'global' }, deptFilter] }
      } else {
        const role = session.user.role
        const targetFilter = [{ target: 'all' }, { target: role === 'student' ? 'students' : 'teachers' }]
        if (session.user.department) {
          targetFilter.push({ target: 'department', targetDepartment: session.user.department })
        }
        query = { $and: [notExpired, { scope: 'global' }, deptFilter, { $or: targetFilter }] }
      }
    }

    const total = await db.collection('announcements').countDocuments(query)
    const announcements = await db
      .collection('announcements')
      .find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Mark this club's notifications as read for the requester
    if (scope === 'club' && clubId) {
      const me = identityOf(session)
      const announcementIds = announcements.map(a => a._id.toString())
      if (me && announcementIds.length > 0) {
        await db.collection('notifications').updateMany(
          {
            'recipient.id': me.id,
            'recipient.collection': me.collection,
            type: 'club',
            referenceId: { $in: announcementIds },
            isRead: false,
          },
          { $set: { isRead: true } }
        )
      }
    }

    return NextResponse.json({
      announcements,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/announcements - Create announcement
export async function POST(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { title, content, target, targetDepartment, scope, clubId, attachments, expiresAt, poll } = body

    const hasTitle = title && title.trim()
    const hasContent = content && content.trim()
    const hasAttachments = attachments && attachments.length > 0
    const hasPoll = poll && poll.question

    if (!hasTitle && !hasContent && !hasAttachments && !hasPoll) {
      return apiError('Announcement must have a title, content, attachments, or a poll', 400)
    }

    if (hasAttachments) {
      const sizeError = validateAttachmentSizes(attachments)
      if (sizeError) return apiError(sizeError, 413)
    }

    const me = requireIdentity(session)
    let authorRole
    let club = null

    if (scope === 'club' && clubId) {
      club = await db.collection('clubs').findOne({ _id: new ObjectId(clubId) })
      if (!club) return apiError('Club not found', 404)

      if (isAdmin(session)) authorRole = 'admin'
      else if (isClubCoordinator(club, session)) authorRole = 'teacher'
      else if (isClubLead(club, session)) authorRole = 'clubLead'
      else return apiError('Not authorized to post club announcements', 403)
    } else {
      if (isAdmin(session)) authorRole = 'admin'
      else if (isTeacher(session)) authorRole = 'teacher'
      else return apiError('Not authorized to create announcements', 403)
    }

    if (poll && poll.question && (!poll.options || poll.options.length < 2)) {
      return apiError('Poll must have at least 2 options', 400)
    }

    const now = new Date()
    const announcementData = {
      title: hasTitle ? title.trim() : '',
      content: hasContent ? content : '',
      author: { id: me.id, collection: me.collection, name: session.user.name, email: session.user.email, role: authorRole },
      target: target || 'all',
      targetDepartment: target === 'department' ? targetDepartment : undefined,
      department: session.user.department,
      scope: scope || 'global',
      clubId: scope === 'club' ? clubId : undefined,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      attachments: hasAttachments ? attachments : [],
      poll: hasPoll
        ? {
            question: poll.question.trim(),
            options: poll.options.map(opt => ({
              _id: new ObjectId().toString(),
              text: typeof opt === 'string' ? opt.trim() : opt.text.trim(),
              votes: [],
            })),
            multiSelect: poll.multiSelect || false,
          }
        : null,
      createdAt: now,
      updatedAt: now,
    }

    const { insertedId } = await db.collection('announcements').insertOne(announcementData)

    // Notify the target audience
    if (scope === 'club' && club) {
      const recipients = (club.members || [])
        .filter(m => m.id !== me.id)
        .map(m => ({ id: m.id, collection: m.collection }))
      if (club.facultyCoordinator && club.facultyCoordinator.id !== me.id) {
        recipients.push({ id: club.facultyCoordinator.id, collection: 'teachers' })
      }
      if (club.studentLead && club.studentLead.id !== me.id) {
        recipients.push({ id: club.studentLead.id, collection: 'students' })
      }
      await insertNotifications(db, recipients, {
        type: 'club',
        referenceId: insertedId.toString(),
        message: `New announcement in "${club.name}": "${title}"`,
      })
    } else {
      const recipients = await resolveTargetRecipients(db, {
        department: session.user.department,
        target: target || 'all',
        targetDepartment,
        excludeId: me.id,
      })
      await insertNotifications(db, recipients, {
        type: 'announcement',
        referenceId: insertedId.toString(),
        message: `New announcement: "${title}"`,
      })
    }

    const created = await db.collection('announcements').findOne({ _id: insertedId })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}

// PUT /api/announcements - Edit announcement
export async function PUT(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { announcementId, title, content, target, targetDepartment } = body

    if (!announcementId) return apiError('Announcement ID is required', 400)

    const announcement = await db.collection('announcements').findOne({ _id: new ObjectId(announcementId) })
    if (!announcement) return apiError('Announcement not found', 404)

    const me = identityOf(session)
    const isCreator = announcement.author?.id === me?.id

    if (!isAdmin(session) && !isCreator) {
      return apiError('Not authorized to edit this announcement', 403)
    }

    const update = { updatedAt: new Date() }
    if (title) update.title = title.trim()
    if (content) update.content = content
    if (target && isAdmin(session)) {
      update.target = target
      update.targetDepartment = target === 'department' ? targetDepartment : undefined
    }

    await db.collection('announcements').updateOne({ _id: new ObjectId(announcementId) }, { $set: update })

    const updated = await db.collection('announcements').findOne({ _id: new ObjectId(announcementId) })
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/announcements - Delete announcement
export async function DELETE(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { searchParams } = new URL(request.url)
    const announcementId = searchParams.get('id')
    if (!announcementId) return apiError('Announcement ID is required', 400)

    const announcement = await db.collection('announcements').findOne({ _id: new ObjectId(announcementId) })
    if (!announcement) return apiError('Announcement not found', 404)

    const me = identityOf(session)
    const isCreator = announcement.author?.id === me?.id

    let canDelete = isAdmin(session) || isCreator
    if (!canDelete && announcement.scope === 'club' && announcement.clubId) {
      const club = await db.collection('clubs').findOne({ _id: new ObjectId(announcement.clubId) })
      if (club) {
        canDelete = isClubCoordinator(club, session) || isClubLead(club, session)
      }
    }

    if (!canDelete) return apiError('Not authorized to delete this announcement', 403)

    await db.collection('announcements').deleteOne({ _id: new ObjectId(announcementId) })

    return NextResponse.json({ message: 'Announcement deleted successfully' })
  } catch (error) {
    return handleAuthError(error)
  }
}
