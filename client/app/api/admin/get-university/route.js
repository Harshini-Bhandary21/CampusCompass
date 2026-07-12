import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'
import { auth } from '@/auth'

export async function GET(request) {
  try {
    const session = await auth()
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    
    const client = await clientPromise
    const db = client.db()
    
    let university
    
    if (session.user.role === 'admin') {
      console.log('Looking for university with admin email:', session.user.email)
      university = await db.collection('universities').findOne({
        'departments.coordinator.email': session.user.email
      })
    }
    
    console.log('Found university:', university ? 'Yes' : 'No')
    
    if (!university) {
      return NextResponse.json({ error: 'University not found' }, { status: 404 })
    }
    
    return NextResponse.json({ 
      success: true, 
      university: {
        _id: university._id.toString(),
        name: university.name,
        departments: university.departments,
        configuration: university.configuration
      }
    })
  } catch (error) {
    console.error('Error in get-university:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}