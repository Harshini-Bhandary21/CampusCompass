import { NextResponse } from 'next/server'
import { auth } from '@/auth'

export async function GET() {
  try {
    const session = await auth()
    return NextResponse.json(session || { user: null })
  } catch (error) {
    return NextResponse.json({ user: null, error: error.message }, { status: 200 })
  }
}