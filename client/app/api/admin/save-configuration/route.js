import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import clientPromise from '@/lib/mongodb'

export async function POST(request) {
  console.log('=== SAVE CONFIGURATION API CALLED ===')
  
  try {
    const session = await auth()
    console.log('Session:', session ? 'Found' : 'Not found')
    console.log('User role:', session?.user?.role)
    
    if (!session || session.user.role !== 'admin') {
      console.log('Unauthorized access attempt')
      return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 })
    }

    const { lunchSlots, tyMDM, btechMDM, extractedData, timestamp } = await request.json()
    console.log('=== FULL CONFIGURATION RECEIVED ===')
    console.log('lunchSlots:', JSON.stringify(lunchSlots, null, 2))
    console.log('tyMDM:', JSON.stringify(tyMDM, null, 2))
    console.log('btechMDM:', JSON.stringify(btechMDM, null, 2))
    console.log('extractedData:', JSON.stringify(extractedData, null, 2))
    
    const client = await clientPromise
    const db = client.db()

    const dataToSave = {
      'configuration.mdmSlots': {
        TY: tyMDM?.mdmData || {},
        BTech: btechMDM?.mdmData || {}
      },
      'configuration.lunchSlots': lunchSlots || {},
      'configuration.extractedData': extractedData,
      'configuration.updatedAt': new Date(timestamp || new Date().toISOString())
    }

    console.log('=== DATA TO SAVE ===')
    console.log(JSON.stringify(dataToSave, null, 2))

    console.log('Updating database for admin:', session.user.email)
    
    // Check if document exists first
    const existingDoc = await db.collection('universities').findOne(
      { 'admin.email': session.user.email }
    )
    console.log('=== EXISTING DOCUMENT FOUND ===')
    console.log('Document exists:', !!existingDoc)
    if (existingDoc) {
      console.log('Document _id:', existingDoc._id)
      console.log('Current configuration:', JSON.stringify(existingDoc.configuration, null, 2))
    }

    const result = await db.collection('universities').updateOne(
      { 'admin.email': session.user.email },
      { $set: dataToSave }
    )

    console.log('=== DATABASE UPDATE RESULT ===')
    console.log('Matched count:', result.matchedCount)
    console.log('Modified count:', result.modifiedCount)
    console.log('Acknowledged:', result.acknowledged)

    // Retrieve and log the saved document
    const savedDoc = await db.collection('universities').findOne(
      { 'admin.email': session.user.email },
      { projection: { configuration: 1, 'admin.email': 1 } }
    )
    console.log('=== SAVED CONFIGURATION IN DATABASE ===')
    console.log('Admin email:', savedDoc?.admin?.email)
    console.log('Configuration:', JSON.stringify(savedDoc?.configuration, null, 2))

    return NextResponse.json({ 
      success: true, 
      message: 'Configuration saved successfully',
      modifiedCount: result.modifiedCount
    })
  } catch (error) {
    console.error('=== SAVE CONFIGURATION ERROR ===')
    console.error('Error message:', error.message)
    console.error('Error stack:', error.stack)
    return NextResponse.json({ success: false, message: 'Failed to save configuration' }, { status: 500 })
  }
}
