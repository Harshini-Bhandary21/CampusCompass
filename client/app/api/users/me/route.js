import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import clientPromise from '@/lib/mongodb'
import { requireAuth, apiError, handleAuthError } from '@/lib/permissions'

// GET /api/users/me - Fetch the current user's own profile, including
// profilePhoto (deliberately excluded from the JWT — see auth.js).
export async function GET() {
  try {
    const session = await requireAuth()

    if (session.user.role === 'admin') {
      return NextResponse.json({
        role: 'admin',
        name: session.user.name,
        email: session.user.email,
        department: session.user.department,
        university: session.user.university,
      })
    }

    const client = await clientPromise
    const db = client.db()
    const collection = session.user.role === 'teacher' ? 'teachers' : 'students'

    const user = await db
      .collection(collection)
      .findOne(
        { _id: new ObjectId(session.user.id) },
        { projection: { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 } }
      )

    if (!user) return apiError('User not found', 404)

    return NextResponse.json({ ...user, role: session.user.role })
  } catch (error) {
    return handleAuthError(error)
  }
}
