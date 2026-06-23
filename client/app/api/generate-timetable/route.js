// app/api/generate-timetable/route.js
import { NextResponse } from 'next/server'

const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5000'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file')

    if (!file) {
      return NextResponse.json({ success: false, error: 'No file provided' }, { status: 400 })
    }

    // Forward the file to Flask
    const flaskForm = new FormData()
    flaskForm.append('file', file)

    // OR-Tools can take several minutes — set a long timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 30 * 60 * 1000) // 30 min

    let flaskResponse
    try {
      flaskResponse = await fetch(`${FLASK_URL}/schedule`, {
        method: 'POST',
        body: flaskForm,
        signal: controller.signal,
      })
    } finally {
      clearTimeout(timeoutId)
    }

    if (!flaskResponse.ok) {
      const err = await flaskResponse.json().catch(() => ({}))
      return NextResponse.json(
        { success: false, error: err.error || 'Flask returned an error' },
        { status: 500 }
      )
    }

    const data = await flaskResponse.json()
    // data = { success, scheduled, total, rows, unscheduled, run_id }
    return NextResponse.json(data)

  } catch (error) {
    if (error.name === 'AbortError') {
      return NextResponse.json(
        { success: false, error: 'Solver timed out (>10 min). Try reducing the dataset.' },
        { status: 504 }
      )
    }
    console.error('API route error:', error)
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 })
  }
}

export const maxDuration = 600 // Next.js 14 edge runtime timeout in seconds