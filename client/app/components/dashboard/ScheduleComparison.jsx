'use client'

import { useState, useMemo } from 'react'
import { CheckCircleIcon, XMarkIcon, ArrowDownTrayIcon, ChartBarIcon } from '@heroicons/react/24/outline'
import TimetableAnalyticsDetailed from './TimetableAnalyticsDetailed'

function analyzeSchedule(scheduleData) {
  const dayDistribution = { Monday: 0, Tuesday: 0, Wednesday: 0, Thursday: 0, Friday: 0 }
  const typeDistribution = { Lab: 0, Theory: 0 }
  const batchCount = new Set(scheduleData.map(s => s.batch)).size
  const roomCount = new Set(scheduleData.map(s => s.room).filter(r => r && !r.includes('ONLINE'))).size
  const facultyCount = new Set(scheduleData.map(s => s.faculty)).size
  const roomUtilization = {}
  const batchTypes = {}
  
  // Normalize day names (Mon -> Monday, Tue -> Tuesday, etc.)
  const dayMap = {
    'Mon': 'Monday', 'Monday': 'Monday',
    'Tue': 'Tuesday', 'Tuesday': 'Tuesday',
    'Wed': 'Wednesday', 'Wednesday': 'Wednesday',
    'Thu': 'Thursday', 'Thursday': 'Thursday',
    'Fri': 'Friday', 'Friday': 'Friday',
    'Sat': 'Saturday', 'Saturday': 'Saturday'
  }
  
  scheduleData.forEach(slot => {
    const normalizedDay = dayMap[slot.day] || slot.day
    dayDistribution[normalizedDay] = (dayDistribution[normalizedDay] || 0) + 1
    typeDistribution[slot.type] = (typeDistribution[slot.type] || 0) + 1
    if (slot.room && !slot.room.includes('ONLINE')) {
      roomUtilization[slot.room] = (roomUtilization[slot.room] || 0) + 1
    }
    batchTypes[slot.batch] = slot.type
  })
  
  const topRooms = Object.entries(roomUtilization).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const labBatches = Object.values(batchTypes).filter(t => t === 'Lab').length
  const theoryBatches = Object.values(batchTypes).filter(t => t === 'Theory').length
  
  return { dayDistribution, typeDistribution, batchCount, roomCount, facultyCount, topRooms, labBatches, theoryBatches, totalClasses: scheduleData.length }
}

export default function ScheduleComparison({ schedulesData = [], isOpen, onClose, onSelect, rawResults }) {
  const [selectedSchedule, setSelectedSchedule] = useState(null)
  const [showAnalytics, setShowAnalytics] = useState(null)
  const [deployingId, setDeployingId] = useState(null)

  const schedules = useMemo(() => {
    if (!schedulesData.length) return []
    
    const colors = ['#10b981', '#3b82f6', '#8b5cf6']
    const gradients = [
      'from-green-500 to-emerald-600',
      'from-blue-500 to-cyan-600',
      'from-purple-500 to-pink-600'
    ]
    
    return schedulesData.map((scheduleData, idx) => ({
      id: idx + 1,
      name: scheduleData.name || `Schedule Option ${idx + 1}`,
      ...analyzeSchedule(scheduleData.slots || []),
      color: colors[idx % colors.length],
      gradient: gradients[idx % gradients.length]
    }))
  }, [schedulesData])

  const handleDownload = async (schedule) => {
    try {
      const scheduleKey = `schedule${schedule.id}`
      
      // Check if rawResults has the base64 data
      if (rawResults && rawResults[scheduleKey]) {
        const base64Data = typeof rawResults[scheduleKey] === 'string' 
          ? rawResults[scheduleKey] 
          : rawResults[scheduleKey]?.data
        
        if (base64Data) {
          // Convert base64 to blob and download
          const binaryString = atob(base64Data)
          const bytes = new Uint8Array(binaryString.length)
          for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i)
          }
          const blob = new Blob([bytes], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
          const url = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = url
          a.download = `${schedule.name.replace(/\s+/g, '_')}.xlsx`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(url)
          return
        }
      }
      
      // Fallback: create from scheduleData if rawResults not available
      const scheduleData = schedulesData[schedule.id - 1]
      if (!scheduleData || !scheduleData.slots) {
        alert('No schedule data available')
        return
      }

      const XLSX = await import('xlsx')
      const ws = XLSX.utils.json_to_sheet(scheduleData.slots)
      const wb = XLSX.utils.book_new()
      XLSX.utils.book_append_sheet(wb, ws, 'Schedule')
      XLSX.writeFile(wb, `${schedule.name.replace(/\s+/g, '_')}.xlsx`)
    } catch (error) {
      alert('Download failed: ' + error.message)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">Generated Schedules - Analytics</h2>
            <p className="text-slate-600 text-sm mt-1">Compare and select the best schedule option</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <XMarkIcon className="h-6 w-6 text-slate-600" />
          </button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-4 space-y-4">
          {schedules.map((schedule) => {
            const previewData = schedulesData[schedule.id - 1]?.slots.slice(0, 5) || []
            const maxDayClasses = Math.max(...Object.values(schedule.dayDistribution))
            
            return (
              <div key={schedule.id} className="border-2 border-slate-200 rounded-xl bg-white shadow-lg">
                {/* Header */}
                <div className="bg-gradient-to-r from-slate-50 to-slate-100 p-3 border-b border-slate-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full bg-gradient-to-r ${schedule.gradient}`}></div>
                    <h3 className="font-bold text-lg text-slate-900">{schedule.name}</h3>
                  </div>
                  <div className="text-xs text-slate-600 font-medium">{schedule.totalClasses} Total Classes</div>
                </div>

                <div className="p-4">
                  {/* Stats Grid */}
                  <div className="grid grid-cols-5 gap-3 mb-4">
                    <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-3 text-center border border-blue-200 relative overflow-hidden">
                      <svg className="absolute top-1 right-1 w-10 h-10 opacity-10" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                      </svg>
                      <div className="text-2xl font-bold text-blue-600">{schedule.batchCount}</div>
                      <div className="text-sm text-blue-700">Batches</div>
                    </div>
                    <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-3 text-center border border-purple-200 relative overflow-hidden">
                      <svg className="absolute top-1 right-1 w-10 h-10 opacity-10" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3z" />
                      </svg>
                      <div className="text-2xl font-bold text-purple-600">{schedule.facultyCount}</div>
                      <div className="text-sm text-purple-700">Faculty</div>
                    </div>
                    <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-3 text-center border border-orange-200 relative overflow-hidden">
                      <svg className="absolute top-1 right-1 w-10 h-10 opacity-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
                      </svg>
                      <div className="text-2xl font-bold text-orange-600">{schedule.roomCount}</div>
                      <div className="text-sm text-orange-700">Rooms</div>
                    </div>
                    <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-3 text-center border border-cyan-200 relative overflow-hidden">
                      <svg className="absolute top-1 right-1 w-10 h-10 opacity-10" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                      <div className="text-2xl font-bold text-cyan-600">{schedule.typeDistribution.Lab}</div>
                      <div className="text-sm text-cyan-700">Labs</div>
                    </div>
                    <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-lg p-3 text-center border border-green-200 relative overflow-hidden">
                      <svg className="absolute top-1 right-1 w-10 h-10 opacity-10" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                      </svg>
                      <div className="text-2xl font-bold text-green-600">{schedule.typeDistribution.Theory}</div>
                      <div className="text-sm text-green-700">Theory</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-4">
                    {/* Day Distribution */}
                    <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-lg p-3 border border-purple-200 relative overflow-hidden">
                      <div className="absolute top-2 right-2 opacity-10">
                        <svg className="w-8 h-8 text-purple-600" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-purple-800 mb-3">Weekly Distribution</h4>
                      <div className="flex items-end justify-between gap-1 h-28">
                        {Object.entries(schedule.dayDistribution).map(([day, count]) => (
                          <div key={day} className="flex-1 flex flex-col items-center gap-1">
                            <div className="text-sm font-bold text-slate-900">{count}</div>
                            <div 
                              className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t transition-all"
                              style={{ height: `${(count / maxDayClasses) * 100}%` }}
                            ></div>
                            <div className="text-[10px] font-medium text-slate-600">{day.slice(0, 3)}</div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Room Utilization */}
                    <div className="bg-gradient-to-br from-orange-50 to-red-50 rounded-lg p-3 border border-orange-200 relative overflow-hidden">
                      <div className="absolute top-2 right-2 opacity-10">
                        <svg className="w-8 h-8 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                        </svg>
                      </div>
                      <h4 className="text-sm font-bold text-orange-800 mb-3">Top Utilized Rooms</h4>
                      <div className="space-y-2">
                        {schedule.topRooms.map(([room, count]) => (
                          <div key={room} className="flex items-center gap-2">
                            <div className="text-xs font-bold text-slate-700 w-16 truncate">{room}</div>
                            <div className="flex-1 bg-orange-200 rounded-full h-5 overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-orange-500 to-red-500 flex items-center justify-center text-white text-xs font-bold"
                                style={{ width: `${(count / schedule.topRooms[0][1]) * 100}%` }}
                              >{count}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Preview Table */}
                  <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                    <h4 className="text-xs font-bold text-slate-800 mb-2">Schedule Preview (First 5 entries)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead className="bg-slate-200">
                          <tr>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Day</th>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Time</th>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Batch</th>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Course</th>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Faculty</th>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Room</th>
                            <th className="px-2 py-1 text-left font-semibold text-slate-700">Type</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white">
                          {previewData.map((slot, i) => (
                            <tr key={i} className="border-b border-slate-100">
                              <td className="px-2 py-1 text-slate-700">{slot.day}</td>
                              <td className="px-2 py-1 text-slate-700">{slot.time}</td>
                              <td className="px-2 py-1 text-slate-700">{slot.batch}</td>
                              <td className="px-2 py-1 text-slate-700 truncate max-w-[150px]">{slot.course}</td>
                              <td className="px-2 py-1 text-slate-700">{slot.faculty}</td>
                              <td className="px-2 py-1 text-slate-700">{slot.room}</td>
                              <td className="px-2 py-1">
                                <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                  slot.type === 'Lab' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                }`}>{slot.type}</span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="bg-slate-50 p-3 border-t border-slate-200 flex gap-2">
                  <button
                    disabled={deployingId !== null}
                    onClick={async () => {
                      if (!onSelect) {
                        onClose()
                        return
                      }
                      setDeployingId(schedule.id)
                      try {
                        await onSelect(schedule.id)
                        onClose()
                      } catch (err) {
                        // Error already toasted in parent; keep modal open so user can retry.
                      } finally {
                        setDeployingId(null)
                      }
                    }}
                    className="flex-1 py-2 px-4 rounded-lg font-bold text-sm transition-all flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white hover:shadow-lg disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    {deployingId === schedule.id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                        </svg>
                        Deploying...
                      </>
                    ) : (
                      <>
                        <CheckCircleIcon className="h-4 w-4" />
                        Select & Deploy
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => setShowAnalytics(schedule.id)}
                    className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-lg hover:shadow-lg font-bold text-sm flex items-center gap-2 transition-all"
                  >
                    <ChartBarIcon className="h-4 w-4" />
                    Analytics
                  </button>
                  <button
                    onClick={() => handleDownload(schedule)}
                    className="px-4 py-2 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-lg hover:shadow-lg font-bold text-sm flex items-center gap-2 transition-all"
                  >
                    <ArrowDownTrayIcon className="h-4 w-4" />
                    Download
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-200 p-4 bg-slate-50 flex justify-end gap-3">
          <button onClick={onClose} className="px-6 py-2 border-2 border-slate-300 text-slate-700 rounded-lg hover:bg-white font-bold text-sm transition-all">
            Close
          </button>
        </div>
      </div>

      {/* Analytics Modal */}
      {showAnalytics && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl max-w-7xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-slate-200">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">Schedule {showAnalytics} - Detailed Analytics</h2>
                <p className="text-slate-600 text-sm mt-1">Comprehensive analysis of the generated timetable</p>
              </div>
              <button onClick={() => setShowAnalytics(null)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                <XMarkIcon className="h-6 w-6 text-slate-600" />
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-140px)] p-6">
              <TimetableAnalyticsDetailed scheduleData={schedulesData[showAnalytics - 1]?.slots || []} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
      