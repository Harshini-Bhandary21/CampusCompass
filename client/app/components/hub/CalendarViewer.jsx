'use client'

import { useEffect, useState } from 'react'
import { CalendarDays, Download } from 'lucide-react'

export default function CalendarViewer() {
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/calendar')
      .then(r => r.json())
      .then(setCalendar)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading calendar...</p></div>
  }

  if (!calendar) {
    return (
      <div className="dashboard-empty-state">
        <h3 className="dashboard-empty-title">No academic calendar uploaded yet</h3>
        <p className="dashboard-empty-text">Check back once your department coordinator uploads one.</p>
      </div>
    )
  }

  const isImage = /\.(png|jpe?g|gif|webp)$/i.test(calendar.fileName || '')

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="dashboard-panel-title flex items-center gap-2 !mb-0">
          <CalendarDays size={20} className="text-primary" /> Academic Calendar
        </h2>
        <a
          href={calendar.fileUrl}
          download={calendar.fileName}
          className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-primary border border-primary/30 rounded-lg hover:bg-primary/5 transition-colors"
        >
          <Download size={14} /> Download
        </a>
      </div>
      <div className="dashboard-panel">
        {isImage ? (
          <img src={calendar.fileUrl} alt={calendar.fileName} className="w-full rounded-lg" />
        ) : (
          <iframe src={calendar.fileUrl} title="Academic Calendar" className="w-full h-[70vh] rounded-lg border border-gray-200" />
        )}
      </div>
    </div>
  )
}
