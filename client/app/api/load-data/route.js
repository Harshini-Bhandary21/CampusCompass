import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import clientPromise from '@/lib/mongodb'
import { requireAdmin, apiError, handleAuthError } from '@/lib/permissions'

// POST /api/load-data - Bulk-create teacher or student accounts (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const body = await request.json()
    const { users: usersData, role } = body

    if (!usersData || !Array.isArray(usersData) || usersData.length === 0) {
      return apiError('No user data provided', 400)
    }
    if (!['student', 'teacher'].includes(role)) {
      return apiError('Invalid role. Must be student or teacher.', 400)
    }

    const collection = role === 'student' ? 'students' : 'teachers'
    const results = { created: 0, skipped: 0, errors: [] }

    for (let i = 0; i < usersData.length; i++) {
      const row = usersData[i]
      const rowNum = i + 1

      try {
        if (role === 'student') {
          if (!row.name || !row.prn || !row.department || !row.semester || !row.email) {
            results.errors.push({ row: rowNum, error: 'Missing required fields (name, prn, department, semester, email)' })
            results.skipped++
            continue
          }
          const existingPrn = await db.collection('students').findOne({ prn: row.prn })
          if (existingPrn) {
            results.errors.push({ row: rowNum, error: `Duplicate PRN: ${row.prn}` })
            results.skipped++
            continue
          }
        } else if (!row.name || !row.email || !row.department) {
          results.errors.push({ row: rowNum, error: 'Missing required fields (name, email, department)' })
          results.skipped++
          continue
        }

        const normalizedEmail = row.email.toLowerCase().trim()
        const existingEmail = await db.collection(collection).findOne({ email: normalizedEmail })
        if (existingEmail) {
          results.errors.push({ row: rowNum, error: `Duplicate email: ${row.email}` })
          results.skipped++
          continue
        }

        const defaultPassword = role === 'student' ? row.prn : normalizedEmail
        const passwordHash = await bcrypt.hash(defaultPassword, 12)

        const now = new Date()
        const userData = {
          name: row.name.trim(),
          email: normalizedEmail,
          passwordHash,
          department: row.department?.trim() || session.user.department,
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
          userData.prn = row.prn.trim()
          userData.semester = parseInt(row.semester)
        } else {
          userData.designation = row.designation?.trim() || ''
          userData.cabinNumber = ''
          userData.qualification = ''
          userData.experience = ''
          userData.researchAreas = []
        }

        await db.collection(collection).insertOne(userData)
        results.created++
      } catch (err) {
        results.errors.push({ row: rowNum, error: err.message })
        results.skipped++
      }
    }

    return NextResponse.json({
      message: `Bulk upload complete: ${results.created} created, ${results.skipped} skipped`,
      ...results,
    })
  } catch (error) {
    return handleAuthError(error)
  }
}
