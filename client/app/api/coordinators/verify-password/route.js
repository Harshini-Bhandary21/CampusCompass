import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import bcrypt from 'bcryptjs'

export async function POST(request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { password } = await request.json()

    if (!password) {
      return NextResponse.json({ success: false, message: 'Password is required' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    const university = await db.collection('universities').findOne({
      'departments.coordinator.email': session.user.email,
    })

    const department = university?.departments.find(
      dept => dept.coordinator?.email === session.user.email
    )

    if (!department?.coordinator?.passwordHash) {
      return NextResponse.json({ success: false, message: 'Coordinator not found' }, { status: 404 })
    }

    const match = await bcrypt.compare(password, department.coordinator.passwordHash)

    if (!match) {
      return NextResponse.json({ success: false, message: 'Invalid password' }, { status: 401 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 })
  }
}
