import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireAdmin, isAdmin, apiError, handleAuthError } from '@/lib/permissions'

function buildFilter({ search, department, semester, status, isAdminSession }) {
  const filter = {}
  filter.status = isAdminSession ? (status || 'active') : 'active'
  if (department) filter.department = { $regex: department, $options: 'i' }
  if (semester) filter.semester = parseInt(semester)
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { prn: { $regex: search, $options: 'i' } },
    ]
  }
  return filter
}

// GET /api/users - List teachers and/or students with filters
export async function GET(request) {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || '' // 'teacher' | 'student' | '' (both)
    const department = searchParams.get('department') || ''
    const semester = searchParams.get('semester') || ''
    const status = searchParams.get('status') || ''
    const isAdminSession = isAdmin(session)

    const filter = buildFilter({ search, department, semester, status, isAdminSession })
    const projection = { passwordHash: 0, resetPasswordToken: 0, resetPasswordExpires: 0 }

    const users = []

    if (!role || role === 'teacher') {
      const teachers = await db.collection('teachers').find(filter, { projection }).sort({ name: 1 }).toArray()
      users.push(...teachers.map(t => ({ ...t, role: 'teacher' })))
    }

    if (!role || role === 'student') {
      const students = await db.collection('students').find(filter, { projection }).sort({ name: 1 }).toArray()
      users.push(...students.map(s => ({ ...s, role: 'student' })))
    }

    users.sort((a, b) => (a.name || '').localeCompare(b.name || ''))

    return NextResponse.json(users)
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/users - Create a new teacher or student account (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { name, email, role, prn, semester, designation } = body

    if (!name || !email || !role) {
      return apiError('Name, email, and role are required', 400)
    }
    if (!['student', 'teacher'].includes(role)) {
      return apiError('Invalid role. Must be student or teacher.', 400)
    }

    const collection = role === 'student' ? 'students' : 'teachers'
    const normalizedEmail = email.toLowerCase().trim()

    const existingEmail = await db.collection(collection).findOne({ email: normalizedEmail })
    if (existingEmail) {
      return apiError('A user with this email already exists', 409)
    }

    if (role === 'student') {
      if (!prn) return apiError('PRN is required for students', 400)
      const existingPrn = await db.collection('students').findOne({ prn })
      if (existingPrn) return apiError('A student with this PRN already exists', 409)
    }

    // Default password per policy: student = PRN, teacher = email
    const defaultPassword = role === 'student' ? prn : normalizedEmail
    const passwordHash = await bcrypt.hash(defaultPassword, 12)

    const now = new Date()
    const userData = {
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      department: session.user.department,
      university: session.user.university,
      status: 'active',
      profilePhoto: null,
      phone: '',
      about: '',
      createdBy: { id: session.user.id, email: session.user.email },
      resetPasswordToken: null,
      resetPasswordExpires: null,
      createdAt: now,
      updatedAt: now,
    }

    if (role === 'student') {
      userData.prn = prn.trim()
      userData.semester = semester ? parseInt(semester) : null
    } else {
      userData.designation = designation?.trim() || ''
      userData.cabinNumber = ''
      userData.qualification = ''
      userData.experience = ''
      userData.researchAreas = []
    }

    const { insertedId } = await db.collection(collection).insertOne(userData)

    return NextResponse.json(
      { _id: insertedId, name: userData.name, email: userData.email, role, department: userData.department, status: userData.status },
      { status: 201 }
    )
  } catch (error) {
    return handleAuthError(error)
  }
}
