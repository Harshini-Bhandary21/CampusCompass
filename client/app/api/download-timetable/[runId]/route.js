// app/api/download-timetable/[runId]/route.js
import { NextResponse } from 'next/server'

const FLASK_URL = process.env.FLASK_URL || 'http://localhost:5000'

export async function GET(request, { params }) {
  const { runId } = await params

  if (!runId || !/^[a-f0-9]+$/.test(runId)) {
    return NextResponse.json({ error: 'Invalid run id' }, { status: 400 })
  }

  const flaskRes = await fetch(`${FLASK_URL}/download/${runId}`)
  if (!flaskRes.ok) {
    return NextResponse.json({ error: 'File not found on server' }, { status: 404 })
  }

  const buffer = await flaskRes.arrayBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="generated_timetable.xlsx"',
    },
  })
}