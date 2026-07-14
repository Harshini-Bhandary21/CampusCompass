import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireAdmin, isAdmin, isTeacher, apiError, handleAuthError } from '@/lib/permissions'

function collectionFor(request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection')
  return collection === 'teachers' || collection === 'students' ? collection : null
}

// GET /api/users/[id]?collection=teachers|students - Get a single user
export async function GET(request, { params }) {
  try {
    await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const collection = collectionFor(request)
    if (!collection) return apiError('collection query param (teachers|students) is required', 400)

    const user = await db
      .collection(collection)
      .findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } })

    if (!user) return apiError('User not found', 404)

    return NextResponse.json(user)
  } catch (error) {
    return handleAuthError(error)
  }
}

// PATCH /api/users/[id]?collection=teachers|students - Update a user
export async function PATCH(request, { params }) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const collection = collectionFor(request)
    if (!collection) return apiError('collection query param (teachers|students) is required', 400)

    const body = await request.json()
    const user = await db.collection(collection).findOne({ _id: new ObjectId(id) })
    if (!user) return apiError('User not found', 404)

    const isOwnProfile = session.user.id === id
    const isAdminUser = isAdmin(session)
    const update = { updatedAt: new Date() }

    if (isAdminUser) {
      const adminEditableFields = [
        'name', 'email', 'department', 'designation', 'prn', 'semester',
        'phone', 'cabinNumber', 'about', 'profilePhoto', 'status',
        'qualification', 'experience', 'researchAreas',
      ]
      for (const field of adminEditableFields) {
        if (body[field] !== undefined) update[field] = body[field]
      }
      if (body.newPassword) {
        update.passwordHash = await bcrypt.hash(body.newPassword, 12)
      }
    } else if (isOwnProfile && isTeacher(session) && collection === 'teachers') {
      const teacherEditableFields = ['profilePhoto', 'phone', 'cabinNumber', 'about']
      for (const field of teacherEditableFields) {
        if (body[field] !== undefined) update[field] = body[field]
      }
    } else if (isOwnProfile && session.user.role === 'student' && collection === 'students') {
      if (body.profilePhoto !== undefined) update.profilePhoto = body.profilePhoto
      if (body.phone !== undefined) update.phone = body.phone
      if (body.about !== undefined) update.about = body.about
    } else if (!(isOwnProfile && body.currentPassword && body.newPassword)) {
      return apiError('Not authorized to edit this profile', 403)
    }

    // Self-service password change (any role, any collection)
    if (isOwnProfile && body.currentPassword && body.newPassword) {
      const isValid = await bcrypt.compare(body.currentPassword, user.passwordHash)
      if (!isValid) return apiError('Current password is incorrect', 400)
      update.passwordHash = await bcrypt.hash(body.newPassword, 12)
    }

    await db.collection(collection).updateOne({ _id: new ObjectId(id) }, { $set: update })

    const updated = await db
      .collection(collection)
      .findOne({ _id: new ObjectId(id) }, { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } })
    return NextResponse.json(updated)
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/users/[id]?collection=teachers|students - Soft delete a user (Admin only)
export async function DELETE(request, { params }) {
  try {
    await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const { id } = await params
    const collection = collectionFor(request)
    if (!collection) return apiError('collection query param (teachers|students) is required', 400)

    const user = await db.collection(collection).findOne({ _id: new ObjectId(id) })
    if (!user) return apiError('User not found', 404)

    await db.collection(collection).updateOne({ _id: new ObjectId(id) }, { $set: { status: 'deleted', updatedAt: new Date() } })

    return NextResponse.json({ message: 'User account soft-deleted successfully' })
  } catch (error) {
    return handleAuthError(error)
  }
}
