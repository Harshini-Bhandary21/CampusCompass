import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'
import { ObjectId } from 'mongodb'
import bcrypt from 'bcryptjs'

function generatePassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let password = ''
  for (let i = 0; i < 10; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return password
}

export async function POST(request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const { universityId, departmentName, updates } = await request.json()
    
    const client = await clientPromise
    const db = client.db()
    
    // Check if this is a detailed update (has coordinator and department fields)
    let updateFields = {}
    
    if (updates.coordinator && updates.department) {
      // Detailed update for coordinator and department info
      updateFields = {
        'departments.$.code': updates.department.code,
        'departments.$.established': updates.department.established,
        'departments.$.building': updates.department.building,
        'departments.$.stats.students': updates.department.students,
        'departments.$.stats.faculty': updates.department.faculty,
        'departments.$.coordinator.name': updates.coordinator.name,
        'departments.$.coordinator.email': updates.coordinator.email,
        'departments.$.coordinator.phone': updates.coordinator.phone,
        'updatedAt': new Date()
      }
    } else {
      // Original update logic
      updateFields = {
        'departments.$.stats': updates.stats,
        'departments.$.vision': updates.vision,
        'departments.$.mission': updates.mission,
        'updatedAt': new Date()
      }
    }
    
    const result = await db.collection('universities').updateOne(
      { 
        _id: new ObjectId(universityId),
        'departments.name': departmentName
      },
      { 
        $set: updateFields
      }
    )
    
    if (result.modifiedCount === 0) {
      return NextResponse.json({ error: 'Department not found or no changes made' }, { status: 404 })
    }
    
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    console.log('[PUT update-department] body:', body, 'admin:', session.user.email)

    const name = body.name?.trim()
    const code = body.code?.trim()
    const email = body.email?.trim().toLowerCase()
    const password = body.password

    if (!name || !code || !email || !password) {
      console.error('[PUT update-department] missing fields', {
        hasName: !!name, hasCode: !!code, hasEmail: !!email, hasPassword: !!password,
      })
      return NextResponse.json(
        { success: false, message: `Missing required fields: ${[!name && 'name', !code && 'code', !email && 'email', !password && 'password'].filter(Boolean).join(', ')}` },
        { status: 400 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    const university = await db.collection('universities').findOne({ 'admin.email': session.user.email })
    if (!university) {
      console.error('[PUT update-department] no university for admin', session.user.email)
      return NextResponse.json({ success: false, message: `No university found for admin ${session.user.email}` }, { status: 404 })
    }

    // Check if coordinator email or department name/code already exists on this university
    const existingDepts = university.departments || []
    const emailCollision = existingDepts.find(d => d.coordinator?.email?.toLowerCase() === email)
    if (emailCollision) {
      console.error('[PUT update-department] email collision', email, 'in', emailCollision.name)
      return NextResponse.json(
        { success: false, message: `Coordinator email "${email}" is already assigned to department "${emailCollision.name}"` },
        { status: 400 }
      )
    }
    const nameCollision = existingDepts.find(d => d.name?.toLowerCase() === name.toLowerCase())
    if (nameCollision) {
      return NextResponse.json(
        { success: false, message: `Department name "${name}" already exists` },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    await db.collection('universities').updateOne(
      { _id: university._id },
      {
        $push: {
          departments: {
            name,
            code,
            coordinator: {
              email,
              passwordHash: hashedPassword,
              plainPassword: password,
            },
            stats: { students: 0, faculty: 0, classes: 0 },
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        },
      }
    )

    console.log('[PUT update-department] created', { name, code, email })
    return NextResponse.json({ success: true, credentials: { email, password } })
  } catch (error) {
    console.error('[PUT update-department] error:', error)
    return NextResponse.json({ success: false, message: error.message || 'Server error' }, { status: 500 })
  }
}