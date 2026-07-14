import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireIdentity, apiError, handleAuthError } from '@/lib/permissions'

// GET /api/notifications - Fetch current user's notifications
export async function GET(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()
    const me = requireIdentity(session)

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '50')
    const unreadOnly = searchParams.get('unreadOnly') === 'true'

    const query = { 'recipient.id': me.id, 'recipient.collection': me.collection }
    if (unreadOnly) query.isRead = false

    const notifications = await db.collection('notifications').find(query).sort({ createdAt: -1 }).limit(limit).toArray()

    const unreadCount = await db.collection('notifications').countDocuments({
      'recipient.id': me.id,
      'recipient.collection': me.collection,
      isRead: false,
    })

    return NextResponse.json({ notifications, unreadCount })
  } catch (error) {
    return handleAuthError(error)
  }
}

// PATCH /api/notifications - Mark notifications as read
export async function PATCH(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()
    const me = requireIdentity(session)

    const body = await request.json()
    const { notificationIds, markAllRead } = body

    if (markAllRead) {
      await db.collection('notifications').updateMany(
        { 'recipient.id': me.id, 'recipient.collection': me.collection, isRead: false },
        { $set: { isRead: true } }
      )
    } else if (notificationIds && Array.isArray(notificationIds)) {
      await db.collection('notifications').updateMany(
        { _id: { $in: notificationIds.map(id => new ObjectId(id)) }, 'recipient.id': me.id, 'recipient.collection': me.collection },
        { $set: { isRead: true } }
      )
    } else {
      return apiError('Provide notificationIds array or set markAllRead: true', 400)
    }

    return NextResponse.json({ message: 'Notifications updated' })
  } catch (error) {
    return handleAuthError(error)
  }
}
