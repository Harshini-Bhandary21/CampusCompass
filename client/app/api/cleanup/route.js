import { NextResponse } from 'next/server'
import clientPromise from '@/lib/mongodb'

// GET /api/cleanup - Remove expired announcements and group messages.
// Unauthenticated on purpose (matches HUB) — intended to be hit by an
// external cron, not from the UI.
export async function GET() {
  try {
    const client = await clientPromise
    const db = client.db()
    const now = new Date()

    const announcementResult = await db.collection('announcements').deleteMany({
      expiresAt: { $ne: null, $lte: now },
    })

    const messageResult = await db.collection('groupmessages').deleteMany({
      expiresAt: { $ne: null, $lte: now },
    })

    return NextResponse.json({
      message: 'Cleanup completed',
      deletedAnnouncements: announcementResult.deletedCount,
      deletedMessages: messageResult.deletedCount,
    })
  } catch (error) {
    console.error('Cleanup error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
