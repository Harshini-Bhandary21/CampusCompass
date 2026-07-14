import { NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { writeFile, unlink, mkdir } from 'fs/promises'
import path from 'path'
import clientPromise from '@/lib/mongodb'
import { requireAuth, requireAdmin, apiError, handleAuthError } from '@/lib/permissions'
import { resolveTargetRecipients, insertNotifications } from '@/lib/notify'

const UPLOAD_DIR = path.join(process.cwd(), 'public', 'uploads', 'calendars')

async function ensureUploadDir() {
  try {
    await mkdir(UPLOAD_DIR, { recursive: true })
  } catch (e) {
    // directory already exists
  }
}

// GET /api/calendar - Get the active calendar for the requester's department
export async function GET() {
  try {
    const session = await requireAuth()
    const client = await clientPromise
    const db = client.db()

    const calendar = await db
      .collection('academiccalendars')
      .findOne({ isActive: true, department: session.user.department })

    return NextResponse.json(calendar || null)
  } catch (error) {
    return handleAuthError(error)
  }
}

// POST /api/calendar - Upload a new calendar (Admin only)
export async function POST(request) {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file) return apiError('File is required', 400)

    await db
      .collection('academiccalendars')
      .updateMany({ isActive: true, department: session.user.department }, { $set: { isActive: false } })

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    await writeFile(filePath, buffer)

    const now = new Date()
    const calendarDoc = {
      fileUrl: `/uploads/calendars/${fileName}`,
      fileName: file.name,
      department: session.user.department,
      uploadedBy: { id: session.user.id, email: session.user.email, name: session.user.name },
      uploadedAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    const { insertedId } = await db.collection('academiccalendars').insertOne(calendarDoc)

    const recipients = await resolveTargetRecipients(db, {
      department: session.user.department,
      target: 'all',
      excludeId: session.user.id,
    })
    await insertNotifications(db, recipients, {
      type: 'calendar',
      referenceId: insertedId.toString(),
      message: 'The academic calendar has been updated',
    })

    const created = await db.collection('academiccalendars').findOne({ _id: insertedId })
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    return handleAuthError(error)
  }
}

// PUT /api/calendar - Replace the active calendar (Admin only)
export async function PUT(request) {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()
    await ensureUploadDir()

    const formData = await request.formData()
    const file = formData.get('file')
    if (!file || file.size === 0) return apiError('File is required', 400)

    const oldCalendar = await db
      .collection('academiccalendars')
      .findOne({ isActive: true, department: session.user.department })
    if (oldCalendar) {
      try {
        await unlink(path.join(process.cwd(), 'public', oldCalendar.fileUrl))
      } catch (e) {
        // old file may not exist
      }
      await db.collection('academiccalendars').updateOne({ _id: oldCalendar._id }, { $set: { isActive: false } })
    }

    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, '-')}`
    const filePath = path.join(UPLOAD_DIR, fileName)
    await writeFile(filePath, buffer)

    const now = new Date()
    const calendarDoc = {
      fileUrl: `/uploads/calendars/${fileName}`,
      fileName: file.name,
      department: session.user.department,
      uploadedBy: { id: session.user.id, email: session.user.email, name: session.user.name },
      uploadedAt: now,
      isActive: true,
      createdAt: now,
      updatedAt: now,
    }
    const { insertedId } = await db.collection('academiccalendars').insertOne(calendarDoc)

    const created = await db.collection('academiccalendars').findOne({ _id: insertedId })
    return NextResponse.json(created)
  } catch (error) {
    return handleAuthError(error)
  }
}

// DELETE /api/calendar - Delete the active calendar (Admin only)
export async function DELETE() {
  try {
    const session = await requireAdmin()
    const client = await clientPromise
    const db = client.db()

    const calendar = await db
      .collection('academiccalendars')
      .findOne({ isActive: true, department: session.user.department })
    if (!calendar) return apiError('No active calendar to delete', 404)

    try {
      await unlink(path.join(process.cwd(), 'public', calendar.fileUrl))
    } catch (e) {
      // file may not exist
    }

    await db.collection('academiccalendars').deleteOne({ _id: new ObjectId(calendar._id) })

    return NextResponse.json({ message: 'Calendar deleted successfully' })
  } catch (error) {
    return handleAuthError(error)
  }
}
