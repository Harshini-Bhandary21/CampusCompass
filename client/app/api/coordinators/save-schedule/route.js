// app/api/coordinators/save-schedule/route.js
import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const session = await auth()
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { department, filename, scheduleData, runId, scheduled, total, unscheduled } = body

    if (!department || !scheduleData) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    const client = await clientPromise
    const db = client.db()

    // Same lookup pattern as app/api/coordinators/get-department: match the
    // university by coordinator email, then update that coordinator's department.
    const university = await db.collection('universities').findOne({
      'departments.coordinator.email': session.user.email,
    })

    if (!university) {
      return NextResponse.json(
        { success: false, error: `No university found for coordinator ${session.user.email}` },
        { status: 404 }
      )
    }

    const matchedDept = (university.departments || []).find(
      d => d.coordinator?.email === session.user.email
    )
    if (!matchedDept) {
      return NextResponse.json(
        { success: false, error: 'Coordinator is not attached to any department' },
        { status: 404 }
      )
    }

    if (department && department !== matchedDept.name) {
      console.warn(
        '[save-schedule] department slug mismatch — saving to coordinator-owned department',
        { requested: department, storedName: matchedDept.name }
      )
    }

    // Save as the department's selectedSchedule — same shape CurrentScheduleView reads
    const result = await db.collection('universities').updateOne(
      {
        _id: university._id,
        'departments.coordinator.email': session.user.email,
      },
      {
        $set: {
          'departments.$.selectedSchedule': {
            filename,
            scheduleData,   // the rows array — Day, Time, Faculty, Course, Div/Batch, Type, Room
            runId,          // for /api/download-timetable
            selectedAt: new Date(),
            stats: { scheduled, total, unscheduledCount: unscheduled?.length ?? 0 },
          },
        },
      }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save schedule error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}