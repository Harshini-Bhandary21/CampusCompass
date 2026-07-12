import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'

export async function POST(request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { department, password } = await request.json()
    
    const client = await clientPromise
    const db = client.db()
    
    const university = await db.collection('universities').findOne({
      'departments.coordinator.email': session.user.email
    })
    
    if (!university) {
      return NextResponse.json({ success: false, message: 'University not found' }, { status: 404 })
    }
    
    const dept = university.departments.find(d => d.name === department)
    
    if (!dept) {
      return NextResponse.json({ success: false, message: 'Department not found' }, { status: 404 })
    }
    
    const bcrypt = require('bcryptjs')
    
    if (!dept.coordinator || !dept.coordinator.passwordHash) {
      return NextResponse.json({ success: false, message: 'Coordinator password not found' })
    }
    
    const isValid = await bcrypt.compare(password, dept.coordinator.passwordHash)
    
    if (isValid) {
      return NextResponse.json({ success: true })
    } else {
      return NextResponse.json({ success: false, message: 'Invalid password' })
    }
  } catch (error) {
    console.error('Password verification error:', error)
    return NextResponse.json({ success: false, message: 'Verification failed' }, { status: 500 })
  }
}
