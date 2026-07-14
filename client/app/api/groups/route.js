import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import {
  requireAuth,
  requireAdmin,
  isAdmin,
  isTeacher,
  isGroupMember,
  isGroupLead,
  requireIdentity,
  apiError,
  handleAuthError,
} from '@/lib/permissions'
import { resolveActiveMembers } from '@/lib/members'
import { insertNotifications } from '@/lib/notify'

// GET /api/groups - List groups visible to the current user
export async function GET() {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()
    const me = requireIdentity(session)

    const query = isAdmin(session)
      ? { department: session.user.department }
      : { department: session.user.department, members: { $elemMatch: { id: me.id, collection: me.collection } } }

    const groups = await db.collection('groups').find(query).sort({ createdAt: -1 }).toArray()

    const groupsWithUnread = await Promise.all(
      groups.map(async group => {
        const unreadCount = await db.collection('notifications').countDocuments({
          'recipient.id': me.id,
          'recipient.collection': me.collection,
          type: 'message',
          referenceId: group._id.toString(),
          isRead: false,
        })
        return { ...group, unreadCount }
      })
    )

    return NextResponse.json(groupsWithUnread)
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/groups - Create a new group (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { name, description, memberRefs, messagingMode } = body

    if (!name) return apiError('Group name is required', 400)

    const members = await resolveActiveMembers(db, memberRefs)

    const hasTeacher = members.some(m => m.role === 'teacher')
    if (!hasTeacher) {
      return apiError('A group must include at least one teacher', 400)
    }

    const now = new Date()
    const group = {
      name: name.trim(),
      description: description?.trim() || '',
      department: session.user.department,
      members,
      messagingMode: messagingMode || 'open',
      createdBy: { id: session.user.id, email: session.user.email, name: session.user.name },
      createdAt: now,
      updatedAt: now,
    }

    const { insertedId } = await db.collection('groups').insertOne(group)

    await insertNotifications(
      db,
      members.map(m => ({ id: m.id, collection: m.collection })),
      { type: 'system', referenceId: insertedId.toString(), message: `You have been added to the group "${name}"` }
    )

    const created = await db.collection('groups').findOne({ _id: insertedId })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}

// PUT /api/groups - Update a group (Admin, teacher member, or student lead)
export async function PUT(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { groupId, name, description, messagingMode, addMemberRefs, removeMemberRefs, leadRef, revokeLeadRef } = body

    if (!groupId) return apiError('Group ID is required', 400)

    const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) })
    if (!group) return apiError('Group not found', 404)

    const admin = isAdmin(session)
    const teacherMember = isTeacher(session) && isGroupMember(group, session)
    const studentLead = session.user.role === 'student' && isGroupLead(group, session)

    if (!admin && !teacherMember && !studentLead) {
      return apiError('Not authorized to update this group', 403)
    }

    const update = { updatedAt: new Date() }
    if (name && name.trim() !== '') update.name = name.trim()
    else if (!group.name) update.name = 'Untitled Group'

    if (description !== undefined && description !== null) update.description = description.trim()
    if (messagingMode && (admin || teacherMember)) update.messagingMode = messagingMode

    let members = [...group.members]

    if (addMemberRefs && addMemberRefs.length > 0) {
      const newMembers = await resolveActiveMembers(db, addMemberRefs)
      const toAdd = newMembers.filter(nm => !members.some(m => m.id === nm.id && m.collection === nm.collection))
      members = [...members, ...toAdd]
      if (toAdd.length > 0) {
        await insertNotifications(
          db,
          toAdd.map(m => ({ id: m.id, collection: m.collection })),
          { type: 'system', referenceId: groupId, message: `You have been added to the group "${update.name || group.name}"` }
        )
      }
    }

    if (removeMemberRefs && removeMemberRefs.length > 0) {
      members = members.filter(m => !removeMemberRefs.some(r => r.id === m.id && r.collection === m.collection))
    }

    // Nominate a student lead (admin or teacher member)
    if (leadRef && (admin || teacherMember)) {
      members = members.map(m =>
        m.id === leadRef.id && m.collection === leadRef.collection && m.role === 'student'
          ? { ...m, isLead: true }
          : m
      )
    }

    // Revoke a student lead
    if (revokeLeadRef && (admin || teacherMember)) {
      members = members.map(m =>
        m.id === revokeLeadRef.id && m.collection === revokeLeadRef.collection ? { ...m, isLead: false } : m
      )
    }

    update.members = members

    await db.collection('groups').updateOne({ _id: new ObjectId(groupId) }, { $set: update })

    const updated = await db.collection('groups').findOne({ _id: new ObjectId(groupId) })
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/groups - Delete a group (Admin only)
export async function DELETE(request) {
  try {
    await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const { searchParams } = new URL(request.url)
    const groupId = searchParams.get('id')
    if (!groupId) return apiError('Group ID is required', 400)

    const group = await db.collection('groups').findOne({ _id: new ObjectId(groupId) })
    if (!group) return apiError('Group not found', 404)

    await insertNotifications(
      db,
      (group.members || []).map(m => ({ id: m.id, collection: m.collection })),
      { type: 'system', referenceId: groupId, message: `The group "${group.name || 'Untitled Group'}" has been deleted` }
    )

    await db.collection('groups').deleteOne({ _id: new ObjectId(groupId) })
    await db.collection('groupmessages').deleteMany({ groupId })

    return NextResponse.json({ message: 'Group deleted successfully' })
  } catch (error) {
    return handleAuthError(error)
  }
}
