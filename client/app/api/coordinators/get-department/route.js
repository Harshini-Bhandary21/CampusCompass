import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const departmentName = searchParams.get('department')

    const client = await clientPromise
    const db = client.db()

    const university = await db.collection('universities').findOne({
      'departments.coordinator.email': session.user.email
    })

    if (!university) {
      // Return a default department structure for development
      return NextResponse.json({
        success: true,
        department: {
          name: departmentName,
          stats: { students: 0, faculty: 0, courses: 0 },
          vision: 'Department vision not set',
          mission: 'Department mission not set'
        }
      })
    }

    const decodedDepartment = decodeURIComponent(departmentName)

    const department = university.departments.find(
      dept => dept.name === decodedDepartment
    )

    if (!department) {
      // Return a default department structure
      return NextResponse.json({
        success: true,
        department: {
          name: departmentName,
          stats: { students: 0, faculty: 0, courses: 0 },
          vision: 'Department vision not set',
          mission: 'Department mission not set'
        }
      })
    }

    return NextResponse.json({
      success: true,
      department: {
        name: department.name,
        stats: department.stats || { students: 0, faculty: 0, courses: 0 },
        vision: department.vision || 'Department vision not set',
        mission: department.mission || 'Department mission not set',
        timetableData: department.timetableData || null,
        selectedSchedule: department.selectedSchedule || null,
        onlineConfig: department.onlineConfig || null,
        facultyAvailability: department.facultyAvailability || null
      }
    })
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const session = await auth()

    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      department,
      fileName,
      fileData,
      analytics,
      timeSlots,
      selectedSchedule,
      updateScheduleData,
      onlineConfig,
      facultyAvailability,
    } = body

    // Log which fields were sent + approximate size (helps diagnose Mongo 16MB limit).
    const fileBytes = fileData ? Math.round((fileData.length * 3) / 4) : 0

    // Reject files that would blow past MongoDB's 16MB document size limit.
    // Leave ~2MB of headroom for the rest of the university document.
    const MAX_FILE_BYTES = 14 * 1024 * 1024
    if (fileBytes > MAX_FILE_BYTES) {
      return NextResponse.json(
        {
          success: false,
          error: `Excel file is too large (${Math.round(fileBytes / 1024 / 1024)}MB). MongoDB limit is 16MB per document; please trim the workbook below ${Math.round(MAX_FILE_BYTES / 1024 / 1024)}MB.`,
        },
        { status: 413 }
      )
    }

    const client = await clientPromise
    const db = client.db()

    // Find the university that owns this coordinator. This is the only reliable
    // identity — the `department` field from the URL may not match the stored
    // department name exactly, which was silently eating updates before.
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

    // Warn if the URL slug disagrees with the stored department name — this was
    // the original silent-save bug. We still proceed using the coordinator's
    // real department so the save actually happens.
    if (department && department !== matchedDept.name) {
    }

    const updateData = {}

    if (fileName && fileData) {
      updateData['departments.$.timetableData'] = {
        fileName,
        fileData,
        analytics,
        timeSlots,
        uploadedAt: new Date(),
      }
    }

    if (selectedSchedule) {
      updateData['departments.$.selectedSchedule'] = selectedSchedule
    }

    if (updateScheduleData) {
      updateData['departments.$.selectedSchedule.scheduleData'] = updateScheduleData
    }

    if (onlineConfig !== undefined) {
      updateData['departments.$.onlineConfig'] = onlineConfig
    }

    if (facultyAvailability !== undefined) {
      updateData['departments.$.facultyAvailability'] = facultyAvailability
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { success: false, error: 'No updatable fields in request body' },
        { status: 400 }
      )
    }

    // Filter on coordinator email instead of department name so the positional
    // `$` operator always resolves correctly, regardless of URL/name drift.
    const result = await db.collection('universities').updateOne(
      {
        _id: university._id,
        'departments.coordinator.email': session.user.email,
      },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Update matched no documents — coordinator ${session.user.email} may have been detached from a department.`,
        },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Data saved successfully',
      department: matchedDept.name,
      updated: Object.keys(updateData),
    })
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message || 'Server error' },
      { status: 500 }
    )
  }
}
