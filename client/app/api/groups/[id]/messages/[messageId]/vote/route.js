import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAuth, isAdmin, isGroupMember, requireIdentity, apiError, handleAuthError } from '@/lib/permissions'

// POST /api/groups/[id]/messages/[messageId]/vote - Cast/toggle vote on a group message poll
export async function POST(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id, messageId } = await params
    const body = await request.json()
    const { optionId } = body

    if (!optionId) return apiError('Option ID is required', 400)

    const group = await db.collection('groups').findOne({ _id: new ObjectId(id) })
    if (!group) return apiError('Group not found', 404)

    if (!isAdmin(session) && !isGroupMember(group, session)) {
      return apiError('You are not a member of this group', 403)
    }

    const message = await db.collection('groupmessages').findOne({ _id: new ObjectId(messageId) })
    if (!message) return apiError('Message not found', 404)
    if (!message.poll) return apiError('This message does not have a poll', 400)

    const me = requireIdentity(session)
    const sameVoter = v => v.id === me.id && v.collection === me.collection

    const options = message.poll.options.map(opt => ({ ...opt, votes: [...opt.votes] }))
    const target = options.find(opt => opt._id === optionId)
    if (!target) return apiError('Poll option not found', 404)

    const hasVoted = target.votes.some(sameVoter)

    if (hasVoted) {
      target.votes = target.votes.filter(v => !sameVoter(v))
    } else {
      if (!message.poll.multiSelect) {
        for (const opt of options) {
          opt.votes = opt.votes.filter(v => !sameVoter(v))
        }
      }
      target.votes.push({ id: me.id, collection: me.collection })
    }

    await db.collection('groupmessages').updateOne(
      { _id: new ObjectId(messageId) },
      { $set: { 'poll.options': options } }
    )

    const updated = await db.collection('groupmessages').findOne({ _id: new ObjectId(messageId) })
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
