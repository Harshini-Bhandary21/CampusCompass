import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import bcrypt from 'bcryptjs'

// Auth.js v5 beta's error-message propagation from authorize() is not
// reliable enough to depend on for showing a specific "account suspended"
// message, so the sign-in page calls this route separately, after a failed
// signIn(), to figure out *why* it failed (wrong password vs. blocked vs.
// deleted account).
export async function POST(request) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ status: 'not_found' }, { status: 200 })
    }

    const client = await clientPromise
    const db = client.db()

    const teacher = await db.collection('teachers').findOne({ email })
    const student = teacher ? null : await db.collection('students').findOne({ email })
    const account = teacher || student

    if (!account) {
      return NextResponse.json({ status: 'not_found' })
    }

    const passwordMatches = await bcrypt.compare(password, account.passwordHash)
    if (!passwordMatches) {
      return NextResponse.json({ status: 'not_found' })
    }

    return NextResponse.json({ status: account.status || 'active' })
  } catch (error) {
    return NextResponse.json({ status: 'not_found' }, { status: 200 })
  }
}
