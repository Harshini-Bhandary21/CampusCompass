'use client'

import { useState, useMemo } from 'react'
import { ChartBarIcon, AcademicCapIcon, ClockIcon, BuildingOfficeIcon } from '@heroicons/react/24/outline'
import { DAYS } from '../../../lib/constants'

export default function TimetableAnalyticsDetailed({ scheduleData }) {
  const [activeTab, setActiveTab] = useState('student')

  const analytics = useMemo(() => {
    if (!scheduleData || !Array.isArray(scheduleData)) return null

    const days = DAYS
    const batches = [...new Set(scheduleData.map(s => s.Batch || s.batch).filter(Boolean))]
    const faculties = [...new Set(scheduleData.map(s => s.Faculty || s.faculty).filter(Boolean))]
    const timeSlots = [...new Set(scheduleData.map(s => s.Time || s.time).filter(Boolean))].sort()

    // Student Analytics
    const batchWorkload = {}
    const batchDayLoad = {}
    const batchSubjects = {}
    const batchTypeCount = {}

    batches.forEach(batch => {
      batchWorkload[batch] = 0
      batchDayLoad[batch] = {}
      batchSubjects[batch] = {}
      batchTypeCount[batch] = { theory: 0, lab: 0 }
      days.forEach(day => { batchDayLoad[batch][day] = 0 })
    })

    scheduleData.forEach(slot => {
      const batch = slot.Batch || slot.batch
      const day = slot.Day || slot.day
      const subject = slot.Course || slot.course || slot.Subject || slot.subject
      const type = (slot.Type || slot.type || '').toLowerCase()

      if (batch && batches.includes(batch)) {
        batchWorkload[batch]++
        if (day && batchDayLoad[batch][day] !== undefined) {
          batchDayLoad[batch][day]++
        }
        if (subject) {
          batchSubjects[batch][subject] = (batchSubjects[batch][subject] || 0) + 1
        }
        if (type.includes('lab')) {
          batchTypeCount[batch].lab++
        } else {
          batchTypeCount[batch].theory++
        }
      }
    })

    // Faculty Analytics
    const facultyWorkload = {}
    const facultyFreeSlots = {}

    faculties.forEach(faculty => {
      facultyWorkload[faculty] = 0
      facultyFreeSlots[faculty] = (days.length * timeSlots.length)
    })

    scheduleData.forEach(slot => {
      const faculty = slot.Faculty || slot.faculty
      if (faculty && faculties.includes(faculty)) {
        facultyWorkload[faculty]++
        facultyFreeSlots[faculty]--
      }
    })

    // Time Slot Utilization
    const slotUtilization = {}
    const daySlotHeatmap = {}

    days.forEach(day => {
      daySlotHeatmap[day] = {}
      timeSlots.forEach(slot => {
        daySlotHeatmap[day][slot] = 0
      })
    })

    scheduleData.forEach(slot => {
      const time = slot.Time || slot.time
      const day = slot.Day || slot.day
      
      if (time) {
        slotUtilization[time] = (slotUtilization[time] || 0) + 1
      }
      if (day && time && daySlotHeatmap[day] && daySlotHeatmap[day][time] !== undefined) {
        daySlotHeatmap[day][time]++
      }
    })

    // Department Workload (extract from batch names)
    const deptWorkload = {}
    const deptTypeLoad = {}

    scheduleData.forEach(slot => {
      const batch = slot.Batch || slot.batch
      const type = (slot.Type || slot.type || '').toLowerCase()
      
      if (batch) {
        const dept = batch.split('_')[0] || batch.split('-')[0] || batch
        deptWorkload[dept] = (deptWorkload[dept] || 0) + 1
        
        if (!deptTypeLoad[dept]) {
          deptTypeLoad[dept] = { theory: 0, lab: 0 }
        }
        if (type.includes('lab')) {
          deptTypeLoad[dept].lab++
        } else {
          deptTypeLoad[dept].theory++
        }
      }
    })

    return {
      batches,
      faculties,
      days,
      timeSlots,
      batchWorkload,
      batchDayLoad,
      batchSubjects,
      batchTypeCount,
      facultyWorkload,
      facultyFreeSlots,
      slotUtilization,
      daySlotHeatmap,
      deptWorkload,
      deptTypeLoad
    }
  }, [scheduleData])

  if (!analytics) return null

  const getColorClass = (index) => `chart-color-${(index % 8) + 1}`

  const getHeatmapClass = (value, max) => {
    if (value === 0) return 'heat-0'
    const intensity = value / max
    if (intensity < 0.2) return 'heat-0'
    if (intensity < 0.4) return 'heat-1'
    if (intensity < 0.6) return 'heat-2'
    if (intensity < 0.8) return 'heat-3'
    return 'heat-4'
  }

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b dashboard-border">
        <button
          onClick={() => setActiveTab('student')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'student'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <AcademicCapIcon className="h-5 w-5 inline mr-2" />
          Student Analytics
        </button>
        <button
          onClick={() => setActiveTab('faculty')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'faculty'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ChartBarIcon className="h-5 w-5 inline mr-2" />
          Faculty Analytics
        </button>
        <button
          onClick={() => setActiveTab('department')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'department'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
          Department Analytics
        </button>
        <button
          onClick={() => setActiveTab('timeslot')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'timeslot'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ClockIcon className="h-5 w-5 inline mr-2" />
          Time Slot Analytics
        </button>
      </div>

      {/* Student Analytics */}
      {activeTab === 'student' && (
        <div className="space-y-4">
          {/* Heatmap - Day vs Time Slot */}
          <div className="dark-card p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Class Schedule Heatmap</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr>
                    <th className="p-2 text-left">Time</th>
                    {analytics.days.map(day => (
                      <th key={day} className="p-2 text-center">{day.slice(0, 3)}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {analytics.timeSlots.map(slot => {
                    const maxVal = Math.max(...analytics.days.map(day => analytics.daySlotHeatmap[day][slot] || 0))
                    return (
                      <tr key={slot}>
                        <td className="p-2 font-medium text-xs">{slot}</td>
                        {analytics.days.map(day => {
                          const val = analytics.daySlotHeatmap[day][slot] || 0
                          return (
                            <td
                              key={day}
                              className={`p-2 text-center ${getHeatmapClass(val, maxVal)}`}
                            >
                              {val > 0 && <span className="font-bold">{val}</span>}
                            </td>
                          )
                        })}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Total Lectures per Day */}
          <div className="dark-card p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Total Lectures per Day</h3>
            <div className="space-y-2">
              {analytics.days.map(day => {
                const total = Object.values(analytics.batchDayLoad).reduce((sum, batch) => sum + (batch[day] || 0), 0)
                const maxTotal = Math.max(...analytics.days.map(d => 
                  Object.values(analytics.batchDayLoad).reduce((sum, batch) => sum + (batch[d] || 0), 0)
                ))
                return (
                  <div key={day} className="flex items-center">
                    <div className="w-24 font-medium">{day}</div>
                    <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                      <div
                        className="h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold chart-gradient-2"
                        style={{
                          width: `${(total / maxTotal) * 100}%`,
                        }}
                      >
                        {total}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Lab vs Theory Pie Chart */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="dark-card p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Lab vs Theory Distribution</h3>
              {analytics.batches.slice(0, 1).map(batch => {
                const theory = analytics.batchTypeCount[batch].theory
                const lab = analytics.batchTypeCount[batch].lab
                const total = theory + lab
                return (
                  <div key={batch} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span>Theory</span>
                      <span className="font-bold">{theory} ({((theory/total)*100).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="h-4 rounded-full chart-gradient-5"
                        style={{ width: `${(theory/total)*100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Lab</span>
                      <span className="font-bold">{lab} ({((lab/total)*100).toFixed(1)}%)</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="h-4 rounded-full chart-gradient-4"
                        style={{ width: `${(lab/total)*100}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Workload per Class */}
            <div className="dark-card p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Workload per Class</h3>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {Object.entries(analytics.batchWorkload)
                  .sort(([,a], [,b]) => b - a)
                  .map(([batch, hours]) => (
                    <div key={batch} className="flex items-center justify-between">
                      <span className="font-medium">{batch}</span>
                      <span className="px-3 py-1 bg-primary/10 text-primary rounded-full font-bold">
                        {hours} hrs
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Faculty Analytics */}
      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Faculty Workload */}
            <div className="dark-card p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Faculty Workload</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(analytics.facultyWorkload)
                  .sort(([,a], [,b]) => b - a)
                  .map(([faculty, hours], idx) => {
                    const maxHours = Math.max(...Object.values(analytics.facultyWorkload))
                    return (
                      <div key={faculty} className="space-y-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium truncate">{faculty}</span>
                          <span className="font-bold">{hours} hrs</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className={`h-3 rounded-full ${getColorClass(idx)}`}
                            style={{ width: `${(hours / maxHours) * 100}%` }}
                          />
                        </div>
                      </div>
                    )
                  })}
              </div>
            </div>

            {/* Free Slots */}
            <div className="dark-card p-4 rounded-lg">
              <h3 className="text-lg font-bold mb-4">Faculty Free Slots</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {Object.entries(analytics.facultyFreeSlots)
                  .sort(([,a], [,b]) => b - a)
                  .map(([faculty, freeSlots]) => (
                    <div key={faculty} className="flex items-center justify-between">
                      <span className="font-medium truncate">{faculty}</span>
                      <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full font-bold text-sm">
                        {freeSlots} free
                      </span>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Department Analytics */}
      {activeTab === 'department' && (
        <div className="space-y-4">
          {/* Department Workload Bar Chart */}
          <div className="dark-card p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Department vs Total Lecture Hours</h3>
            <div className="space-y-3">
              {Object.entries(analytics.deptWorkload)
                .sort(([,a], [,b]) => b - a)
                .map(([dept, hours], idx) => {
                  const maxHours = Math.max(...Object.values(analytics.deptWorkload))
                  return (
                    <div key={dept} className="flex items-center">
                      <div className="w-32 font-medium">{dept}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-10 relative">
                        <div
                          className={`h-10 rounded-full flex items-center justify-end pr-3 text-white font-bold ${getColorClass(idx)}`}
                          style={{ width: `${(hours / maxHours) * 100}%` }}
                        >
                          {hours}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Stacked Bar - Theory vs Lab */}
          <div className="dark-card p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Department Theory vs Lab Workload</h3>
            <div className="space-y-3">
              {Object.entries(analytics.deptTypeLoad)
                .sort(([,a], [,b]) => (b.theory + b.lab) - (a.theory + a.lab))
                .map(([dept, load]) => {
                  const total = load.theory + load.lab
                  return (
                    <div key={dept} className="space-y-1">
                      <div className="font-medium">{dept}</div>
                      <div className="flex h-10 rounded-lg overflow-hidden">
                        <div
                          className="flex items-center justify-center text-white font-bold text-sm chart-gradient-5"
                          style={{
                            width: `${(load.theory / total) * 100}%`,
                          }}
                        >
                          {load.theory > 0 && `Theory: ${load.theory}`}
                        </div>
                        <div
                          className="flex items-center justify-center text-white font-bold text-sm chart-gradient-4"
                          style={{
                            width: `${(load.lab / total) * 100}%`,
                          }}
                        >
                          {load.lab > 0 && `Lab: ${load.lab}`}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>

          {/* Pie Chart - Department Contribution */}
          <div className="dark-card p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Department Contribution %</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {Object.entries(analytics.deptWorkload)
                .sort(([,a], [,b]) => b - a)
                .map(([dept, hours], idx) => {
                  const total = Object.values(analytics.deptWorkload).reduce((a, b) => a + b, 0)
                  const percent = ((hours / total) * 100).toFixed(1)
                  const chartIndex = (idx % 8) + 1
                  return (
                    <div key={dept} className={`text-center p-4 rounded-lg chart-tint-${chartIndex}`}>
                      <div className={`text-3xl font-bold chart-text-${chartIndex}`}>
                        {percent}%
                      </div>
                      <div className="font-medium mt-2">{dept}</div>
                      <div className="text-sm text-gray-600">{hours} hours</div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}

      {/* Time Slot Analytics */}
      {activeTab === 'timeslot' && (
        <div className="space-y-4">
          {/* Time Slot Utilization Bar Chart */}
          <div className="dark-card p-4 rounded-lg">
            <h3 className="text-lg font-bold mb-4">Time Slot vs Lecture Count</h3>
            <div className="space-y-2">
              {Object.entries(analytics.slotUtilization)
                .sort(([,a], [,b]) => b - a)
                .map(([slot, count]) => {
                  const maxCount = Math.max(...Object.values(analytics.slotUtilization))
                  return (
                    <div key={slot} className="flex items-center">
                      <div className="w-32 font-medium text-sm">{slot}</div>
                      <div className="flex-1 bg-gray-200 rounded-full h-8 relative">
                        <div
                          className="h-8 rounded-full flex items-center justify-end pr-3 text-white font-bold chart-gradient-6"
                          style={{
                            width: `${(count / maxCount) * 100}%`,
                          }}
                        >
                          {count}
                        </div>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
