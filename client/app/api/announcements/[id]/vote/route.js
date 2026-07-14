import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireIdentity, apiError, handleAuthError } from '@/lib/permissions'

// POST /api/announcements/[id]/vote - Cast/toggle vote on a poll
export async function POST(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const body = await request.json()
    const { optionId } = body

    if (!optionId) return apiError('Option ID is required', 400)

    const announcement = await db.collection('announcements').findOne({ _id: new ObjectId(id) })
    if (!announcement) return apiError('Announcement not found', 404)
    if (!announcement.poll) return apiError('This announcement does not have a poll', 400)

    const me = requireIdentity(session)
    const sameVoter = v => v.id === me.id && v.collection === me.collection

    const options = announcement.poll.options.map(opt => ({ ...opt, votes: [...opt.votes] }))
    const target = options.find(opt => opt._id === optionId)
    if (!target) return apiError('Poll option not found', 404)

    const hasVoted = target.votes.some(sameVoter)

    if (hasVoted) {
      target.votes = target.votes.filter(v => !sameVoter(v))
    } else {
      if (!announcement.poll.multiSelect) {
        for (const opt of options) {
          opt.votes = opt.votes.filter(v => !sameVoter(v))
        }
      }
      target.votes.push({ id: me.id, collection: me.collection })
    }

    await db.collection('announcements').updateOne(
      { _id: new ObjectId(id) },
      { $set: { 'poll.options': options, updatedAt: new Date() } }
    )

    const updated = await db.collection('announcements').findOne({ _id: new ObjectId(id) })
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}
