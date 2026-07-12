'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import { DAYS } from '@/lib/constants'

export default function ActivitiesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const departmentName = "First Year"
  const [department, setDepartment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [selectedDay, setSelectedDay] = useState('Monday')
  const [fromTime, setFromTime] = useState('')
  const [toTime, setToTime] = useState('')
  const [eventType, setEventType] = useState('guest-session')
  const [facultyAvailability, setFacultyAvailability] = useState([])
  const [availableRooms, setAvailableRooms] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')

  const days = DAYS
  const eventTypes = [
    { 
      value: 'guest-session', 
      label: 'Guest Session',
      svg: <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/><path d="M17 11h4m-2-2v4" strokeLinecap="round"/></svg>
    },
    { 
      value: 'seminar', 
      label: 'Seminar Session',
      svg: <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/><path d="M7 8l3 3 5-5"/></svg>
    },
    { 
      value: 'faculty-meeting', 
      label: 'Faculty Meeting',
      svg: <svg className="w-16 h-16 mx-auto mb-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>
    }
  ]

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user.role === 'admin') {
      fetchDepartmentData()
    }
  }, [session])

  useEffect(() => {
    if (selectedDay && fromTime && toTime && department) {
      checkAvailability()
    }
  }, [selectedDay, fromTime, toTime, department])

  const fetchDepartmentData = async () => {
    try {
      const response = await fetch(`/api/coordinators/get-department?department=${encodeURIComponent(departmentName)}`)
      const data = await response.json()
      if (data.success) {
        setDepartment(data.department)
      }
    } catch (error) {
      console.error('Error fetching department data:', error)
    } finally {
      setLoading(false)
    }
  }

  const normalizeDayName = (day) => {
    const dayMap = {
      'Mon': 'Monday', 'Monday': 'Monday',
      'Tue': 'Tuesday', 'Tuesday': 'Tuesday',
      'Wed': 'Wednesday', 'Wednesday': 'Wednesday',
      'Thu': 'Thursday', 'Thursday': 'Thursday',
      'Fri': 'Friday', 'Friday': 'Friday',
      'Sat': 'Saturday', 'Saturday': 'Saturday'
    }
    return dayMap[day] || day
  }

  const expandTimeSlot = (timeStr) => {
    // Handle combined slots like "08:30-09:25 & 09:25-10:20"
    if (timeStr.includes('&')) {
      return timeStr.split('&').map(t => t.trim())
    }
    return [timeStr]
  }

  const timeSlotsOverlap = (slot1, slot2) => {
    const slots1 = expandTimeSlot(slot1)
    const slots2 = expandTimeSlot(slot2)
    
    // Check if any expanded slots match
    return slots1.some(s1 => slots2.includes(s1))
  }

  const checkAvailability = () => {
    const schedule = department?.selectedSchedule?.scheduleData || []
    const timeSlots = department?.timetableData?.timeSlots || []
    const analytics = department?.timetableData?.analytics || {}
    
    // Extract rooms and faculty from analytics
    const rooms = analytics.rooms || []
    const faculty = analytics.faculty || []

    // Create combined time slot for the event
    const eventTimeSlot = `${fromTime} & ${toTime}`

    // Find busy faculty
    const busyFacultyNames = []
    schedule.forEach(s => {
      const sDay = normalizeDayName(s.Day || s.day)
      const sTime = s.Time || s.time
      const sFaculty = s.Faculty || s.faculty
      
      if (sDay === selectedDay && timeSlotsOverlap(sTime, eventTimeSlot) && sFaculty) {
        busyFacultyNames.push(sFaculty)
      }
    })
    
    const busyFaculty = [...new Set(busyFacultyNames)]

    // Get free faculty
    const freeFaculty = faculty
      .filter(f => !busyFaculty.includes(f.name))
      .map(f => ({
        name: f.name,
        email: f.email,
        department: f.department
      }))

    setFacultyAvailability(freeFaculty)

    // Find busy rooms
    const busyRoomNames = []
    schedule.forEach(s => {
      const sDay = normalizeDayName(s.Day || s.day)
      const sTime = s.Time || s.time
      const sRoom = s.Room || s.room
      
      if (sDay === selectedDay && timeSlotsOverlap(sTime, eventTimeSlot) && sRoom) {
        busyRoomNames.push(sRoom)
      }
    })
    
    const busyRooms = [...new Set(busyRoomNames)]

    // Get available rooms
    const freeRooms = rooms
      .filter(r => !busyRooms.includes(r.name))
      .map(r => ({
        name: r.name,
        type: r.type,
        capacity: r.capacity
      }))

    setAvailableRooms(freeRooms)
  }

  const handleScheduleEvent = async () => {
    if (!eventTitle || !selectedDay || !fromTime || !toTime || !selectedRoom) {
      alert('Please fill all required fields')
      return
    }

    // Here you would typically make an API call to save the event
    alert(`Event "${eventTitle}" scheduled successfully!\nDay: ${selectedDay}\nTime: ${fromTime} - ${toTime}\nRoom: ${selectedRoom}`)
    
    // Reset form
    setEventTitle('')
    setEventDescription('')
    setSelectedRoom('')
    setFromTime('')
    setToTime('')
  }

  if (loading || status === 'loading') {
    return <LoadingSpinner message="Loading activities..." />
  }

  const timeSlots = department?.timetableData?.timeSlots || []

  return (
    <div className="min-h-screen content-bg flex">
      <Sidebar
        activeTab="activities"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          title={`${department?.name || departmentName} Department`}
          subtitle="Schedule Activities"
        />
        
        <div className="p-4 space-y-6">
          {/* Event Scheduling Section */}
          <div className="content-card rounded-xl shadow-lg border content-border p-6">
            <h2 className="text-2xl font-bold dark-text mb-6">Schedule New Activity</h2>
            
            {/* Event Type Selection */}
            <div className="mb-6">
              <label className="block text-sm font-medium dark-text mb-3">Event Type</label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {eventTypes.map(type => (
                  <button
                    key={type.value}
                    onClick={() => setEventType(type.value)}
                    className={`p-6 rounded-xl border-2 transition-all duration-300 transform hover:scale-105 ${
                      eventType === type.value
                        ? 'border-teal-500 bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/30 dark:to-emerald-900/30 shadow-lg'
                        : 'border-gray-200 dark:border-gray-700 hover:border-teal-300 hover:shadow-md'
                    }`}
                  >
                    <div className={eventType === type.value ? 'text-teal-600 dark:text-teal-400' : 'text-gray-400'}>
                      {type.svg}
                    </div>
                    <div className="font-semibold dark-text text-lg">{type.label}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Event Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium dark-text mb-2">Event Title *</label>
                <input
                  type="text"
                  value={eventTitle}
                  onChange={(e) => setEventTitle(e.target.value)}
                  placeholder="Enter event title"
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium dark-text mb-2">Day *</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(e.target.value)}
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  {days.map(day => (
                    <option key={day} value={day}>{day}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium dark-text mb-2">From Time *</label>
                <select
                  value={fromTime}
                  onChange={(e) => setFromTime(e.target.value)}
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
                >
                  <option value="">Select start time</option>
                  {timeSlots.map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark-text mb-2">To Time *</label>
                <select
                  value={toTime}
                  onChange={(e) => setToTime(e.target.value)}
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={!fromTime}
                >
                  <option value="">Select end time</option>
                  {timeSlots.filter((_, idx) => idx > timeSlots.indexOf(fromTime)).map(slot => (
                    <option key={slot} value={slot}>{slot}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium dark-text mb-2">Room *</label>
                <select
                  value={selectedRoom}
                  onChange={(e) => setSelectedRoom(e.target.value)}
                  className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
                  disabled={!fromTime || !toTime}
                >
                  <option value="">Select room</option>
                  {availableRooms.map(room => (
                    <option key={room.name} value={room.name}>
                      {room.name} - {room.type} (Capacity: {room.capacity})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium dark-text mb-2">Description</label>
              <textarea
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Enter event description"
                rows={3}
                className="w-full p-3 border content-border rounded-lg dark-card dark-text focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <button
              onClick={handleScheduleEvent}
              className="w-full md:w-auto px-6 py-3 bg-gradient-to-r from-teal-600 to-emerald-600 text-white font-semibold rounded-lg hover:shadow-lg transition-all"
            >
              Schedule Activity
            </button>
          </div>

          {/* Faculty Availability Section */}
          {fromTime && toTime && (
            <div className="content-card rounded-xl shadow-lg border content-border p-6">
              <h3 className="text-xl font-bold dark-text mb-4">
                Available Faculty - {selectedDay} ({fromTime} - {toTime})
              </h3>
              
              {facultyAvailability.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  <p>No faculty available at this time</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {facultyAvailability.map((faculty, idx) => (
                    <div key={idx} className="p-4 border content-border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 rounded-full bg-teal-100 dark:bg-teal-900 flex items-center justify-center">
                          <span className="text-teal-600 dark:text-teal-400 font-semibold">
                            {faculty.name.charAt(0)}
                          </span>
                        </div>
                        <div>
                          <div className="font-semibold dark-text">{faculty.name}</div>
                          <div className="text-sm text-gray-500">{faculty.email}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Available Rooms Section */}
          {fromTime && toTime && (
            <div className="content-card rounded-xl shadow-lg border content-border p-6">
              <h3 className="text-xl font-bold dark-text mb-4">
                Available Rooms - {selectedDay} ({fromTime} - {toTime})
              </h3>
              
              {availableRooms.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <svg className="h-12 w-12 mx-auto mb-3 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <p>No rooms available at this time</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {availableRooms.map((room, idx) => (
                    <div key={idx} className="p-4 border content-border rounded-lg hover:shadow-md transition-shadow">
                      <div className="flex items-start justify-between mb-2">
                        <div className="font-semibold dark-text text-lg">{room.name}</div>
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          room.type === 'Theory' 
                            ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                            : 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                        }`}>
                          {room.type}
                        </span>
                      </div>
                      <div className="flex items-center text-sm text-gray-600 dark:text-gray-400">
                        <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Capacity: {room.capacity}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
