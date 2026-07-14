import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import {
  requireAuth,
  isAdmin,
  isGroupMember,
  isGroupLead,
  isTeacher,
  canMessageInGroup,
  identityOf,
  requireIdentity,
  apiError,
  handleAuthError,
} from '@/lib/permissions'
import { validateAttachmentSizes } from '@/lib/attachments'
import { insertNotifications } from '@/lib/notify'

// GET /api/groups/[id]/messages - Fetch messages for a group
export async function GET(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) })
    if (!group) return apiError('Group not found', 404)

    if (!isAdmin(session) && !isGroupMember(group, session)) {
      return apiError('You are not a member of this group', 403)
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const before = searchParams.get('before')

    const now = new Date()
    const query = {
      groupId: id,
      $or: [{ expiresAt: null }, { expiresAt: { $exists: false } }, { expiresAt: { $gt: now } }],
    }
    if (before) query.sentAt = { $lt: new Date(before) }

    const messages = await db.collection('groupmessages').find(query).sort({ sentAt: 1 }).limit(limit).toArray()

    const me = requireIdentity(session)
    await db.collection('notifications').updateMany(
      { 'recipient.id': me.id, 'recipient.collection': me.collection, type: 'message', referenceId: group._id.toString(), isRead: false },
      { $set: { isRead: true } }
    )

    return NextResponse.json(messages)
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/groups/[id]/messages - Send a message to a group
export async function POST(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) })
    if (!group) return apiError('Group not found', 404)

    if (!canMessageInGroup(group, session)) {
      return apiError('You are not allowed to send messages in this group', 403)
    }

    const body = await request.json()
    const { content, attachments, expiresAt, poll, messageType } = body

    const hasContent = content && content.trim()
    const hasAttachments = attachments && attachments.length > 0
    const hasPoll = poll && poll.question

    if (!hasContent && !hasAttachments && !hasPoll) {
      return apiError('Message must have content, attachments, or a poll', 400)
    }

    if (hasAttachments) {
      const sizeError = validateAttachmentSizes(attachments)
      if (sizeError) return apiError(sizeError, 413)
    }

    if (hasPoll && (!poll.options || poll.options.length < 2)) {
      return apiError('Poll must have at least 2 options', 400)
    }

    const me = requireIdentity(session)
    const messageData = {
      groupId: id,
      sender: { id: me.id, collection: me.collection, name: session.user.name, role: session.user.role },
      content: hasContent ? content.trim() : '',
      sentAt: new Date(),
      messageType: messageType || (hasPoll ? 'poll' : 'text'),
      attachments: hasAttachments ? attachments : [],
      expiresAt: expiresAt ? new Date(expiresAt) : null,
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
      createdAt: new Date(),
    }

    const { insertedId } = await db.collection('groupmessages').insertOne(messageData)

    const otherMembers = (group.members || []).filter(m => !(m.id === me.id && m.collection === me.collection))
    await insertNotifications(
      db,
      otherMembers.map(m => ({ id: m.id, collection: m.collection })),
      { type: 'message', referenceId: group._id.toString(), message: `New message in "${group.name}"` }
    )

    const created = await db.collection('groupmessages').findOne({ _id: insertedId })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/groups/[id]/messages - Delete a message
export async function DELETE(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const { searchParams } = new URL(request.url)
    const messageId = searchParams.get('messageId')
    if (!messageId) return apiError('Message ID is required', 400)

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) })
    if (!group) return apiError('Group not found', 404)

    const message = await db.collection('groupmessages').findOne({ _id: new ObjectId(messageId) })
    if (!message) return apiError('Message not found', 404)

    const me = identityOf(session)
    const isSender = message.sender?.id === me?.id && message.sender?.collection === me?.collection
    const isLead = isGroupLead(group, session)
    const isTeacherMember = isTeacher(session) && isGroupMember(group, session)

    if (!isAdmin(session) && !isSender && !isLead && !isTeacherMember) {
      return apiError('Not authorized to delete this message', 403)
    }

    await db.collection('groupmessages').deleteOne({ _id: new ObjectId(messageId) })

    return NextResponse.json({ message: 'Message deleted successfully' })
  } catch (error) {
    return handleAuthError(error)
  }
}
