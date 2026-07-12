import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const client = await clientPromise
    const db = client.db()

    const university = await db.collection('universities').findOne({
      'departments.coordinator.email': session.user.email
    })

    if (!university) {
      return NextResponse.json({ success: true, notifications: [] })
    }

    const department = (university.departments || []).find(
      dept => dept.coordinator?.email === session.user.email
    )

    return NextResponse.json({
      success: true,
      notifications: department?.notifications || []
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
