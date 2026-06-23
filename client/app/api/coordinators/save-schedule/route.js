// app/api/coordinators/save-schedule/route.js
import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import connectDB from '@/lib/mongodb'          // adjust to your actual DB helper
import Department from '@/models/Department'    // adjust to your actual model

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { department, filename, scheduleData, runId, scheduled, total, unscheduled } = body

    if (!department || !scheduleData) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 })
    }

    await connectDB()

    // Save as the department's selectedSchedule — same shape CurrentScheduleView reads
    const updated = await Department.findOneAndUpdate(
      { name: department },
      {
        $set: {
          selectedSchedule: {
            filename,
            scheduleData,   // the rows array — Day, Time, Faculty, Course, Div/Batch, Type, Room
            runId,          // for /api/download-timetable
            selectedAt: new Date(),
            stats: { scheduled, total, unscheduledCount: unscheduled?.length ?? 0 },
          },
          // Also push to schedule history if you have that feature
          $push: {
            schedules: {
              filename,
              scheduleData,
              runId,
              createdAt: new Date(),
              scheduled,
              total,
            },
          },
        },
      },
      { new: true, upsert: false }
    )

    if (!updated) {
      return NextResponse.json({ success: false, error: 'Department not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Save schedule error:', error)
    return NextResponse.json({ success: false, error: 'Server error' }, { status: 500 })
  }
}