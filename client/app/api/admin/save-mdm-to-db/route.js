import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { filename, url, publicId, scheduleData, course, mdmTimings } = await request.json()
    
    const client = await clientPromise
    const db = client.db()

    // Store in course-specific field
    const fieldName = course === 'FY' ? 'mdmSchedule' : `mdmSchedule${course}`
    
    const result = await db.collection('universities').updateOne(
      { 'admin.email': session.user.email },
      { 
        $set: { 
          [fieldName]: {
            filename,
            url,
            publicId,
            scheduleData,
            course,
            mdmTimings,
            createdAt: new Date(),
            size: scheduleData?.length || 0
          }
        } 
      }
    )

    if (result.modifiedCount === 0) {
      return NextResponse.json({ success: false, error: 'Failed to save schedule' })
    }

    return NextResponse.json({ success: true, course })
  } catch (error) {
    console.error('Error saving MDM schedule to DB:', error)
    return NextResponse.json({ success: false, error: error.message })
  }
}
