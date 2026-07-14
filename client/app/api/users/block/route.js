import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAdmin, apiError, handleAuthError } from '@/lib/permissions'

// POST /api/users/block - Toggle block/unblock status (Admin only)
export async function POST(request) {
  try {
    await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { userId, collection, action } = body

    if (!userId || !collection || !action) {
      return apiError('userId, collection, and action are required', 400)
    }
    if (!['teachers', 'students'].includes(collection)) {
      return apiError('collection must be "teachers" or "students"', 400)
    }
    if (!['block', 'unblock'].includes(action)) {
      return apiError('Action must be "block" or "unblock"', 400)
    }

    const user = await db.collection(collection).findOne({ _id: new ObjectId(userId) })
    if (!user) return apiError('User not found', 404)
    if (user.status === 'deleted') return apiError('Cannot modify a deleted account', 400)

    const status = action === 'block' ? 'blocked' : 'active'
    await db.collection(collection).updateOne({ _id: new ObjectId(userId) }, { $set: { status, updatedAt: new Date() } })

    return NextResponse.json({ message: `User ${action}ed successfully`, status })
  } catch (error) {
    return handleAuthError(error)
  }
}
