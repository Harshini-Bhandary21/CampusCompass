'use client'

import { useState, useEffect } from 'react'
import Modal from '@/app/components/shared/Modal'

export default function RescheduleModal({
  selectedSlot,
  allScheduleData,
  onClose,
  onReschedule,
  viewType = 'faculty' // 'faculty' or 'room'
}) {
  const [rescheduleType, setRescheduleType] = useState(null) // 'room' or 'faculty'
  const [selectedFaculty, setSelectedFaculty] = useState(null)
  const [showDurationChoice, setShowDurationChoice] = useState(false)
  const [feasibleOptions, setFeasibleOptions] = useState([])

  useEffect(() => {
    if (selectedSlot && rescheduleType) {
      if (rescheduleType === 'room') {
        findFeasibleRooms()
      } else {
        findFeasibleFaculties()
      }
    }
  }, [selectedSlot, rescheduleType])

  const findFeasibleRooms = () => {
    const slotType = (selectedSlot.type || '').toLowerCase()
    const isLab = slotType.includes('lab') || slotType.includes('practical')

    const occupiedRooms = allScheduleData
      .filter(s =>
        (s.Day || s.day) === selectedSlot.day &&
        (s.Time || s.time) === selectedSlot.time
      )
      .map(s => s.Room || s.room)

    const roomsByType = {}
    allScheduleData.forEach(s => {
      const room = s.Room || s.room
      const type = (s.Type || s.type || '').toLowerCase()
      if (room) {
        const isRoomLab = type.includes('lab') || type.includes('practical')
        if (!roomsByType[room]) {
          roomsByType[room] = isRoomLab
        }
      }
    })

    const availableRooms = Object.entries(roomsByType)
      .filter(([room, isRoomLab]) =>
        !occupiedRooms.includes(room) && isRoomLab === isLab
      )
      .map(([room]) => ({ type: 'room', value: room, label: room }))

    setFeasibleOptions(availableRooms)
  }

  const findFeasibleFaculties = () => {
    const occupiedFaculties = allScheduleData
      .filter(s =>
        (s.Day || s.day) === selectedSlot.day &&
        (s.Time || s.time) === selectedSlot.time
      )
      .map(s => s.Faculty || s.faculty)

    const allFaculties = [...new Set(allScheduleData.map(s => s.Faculty || s.faculty))].filter(Boolean)

    const availableFaculties = allFaculties
      .filter(faculty => !occupiedFaculties.includes(faculty))
      .map(faculty => ({ type: 'faculty', value: faculty, label: faculty }))

    setFeasibleOptions(availableFaculties)
  }

  const handleRoomSelect = (room) => {
    onReschedule('room', room)
  }

  const handleFacultySelect = (faculty) => {
    setSelectedFaculty(faculty)
    setShowDurationChoice(true)
  }

  const handleDurationSelect = (isPermanent) => {
    onReschedule('faculty', selectedFaculty, isPermanent)
  }

  return (
    <Modal isOpen={!!selectedSlot} onClose={onClose} title="Reschedule Lecture" size="xl">
      <div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-200">
        <h4 className="font-semibold text-gray-900 mb-2">Current Slot</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
          <div><span className="font-medium">Faculty:</span> {selectedSlot?.faculty}</div>
          <div><span className="font-medium">Batch:</span> {selectedSlot?.batch}</div>
          <div><span className="font-medium">Course:</span> {selectedSlot?.course}</div>
          <div><span className="font-medium">Room:</span> {selectedSlot?.room || selectedSlot?.currentRoom}</div>
          <div><span className="font-medium">Day:</span> {selectedSlot?.day}</div>
          <div><span className="font-medium">Time:</span> {selectedSlot?.time}</div>
          <div><span className="font-medium">Type:</span> {selectedSlot?.type}</div>
        </div>
      </div>

      {!rescheduleType ? (
        <div className="flex gap-4">
          <button
            onClick={() => setRescheduleType('room')}
            className="btn-action btn-action-room flex-1 p-6 text-left"
          >
            <div className="text-xl mb-2">Change Room</div>
            <div className="text-sm opacity-90">Switch to a different room</div>
          </button>
          <button
            onClick={() => setRescheduleType('faculty')}
            className="btn-action btn-action-faculty flex-1 p-6 text-left"
          >
            <div className="text-xl mb-2">Change Faculty</div>
            <div className="text-sm opacity-90">Assign a different faculty</div>
          </button>
        </div>
      ) : !showDurationChoice ? (
        <>
          <h4 className="font-semibold text-gray-900 mb-3">
            {rescheduleType === 'room' ? 'Available Rooms' : 'Available Faculties'} ({feasibleOptions.length})
          </h4>

          {feasibleOptions.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No available {rescheduleType === 'room' ? 'rooms' : 'faculties'} found at this time
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 max-h-96 overflow-y-auto">
              {feasibleOptions.map((option, idx) => (
                <button
                  key={idx}
                  onClick={() => rescheduleType === 'room' ? handleRoomSelect(option.value) : handleFacultySelect(option.value)}
                  className="bg-primary/10 hover:bg-primary hover:text-white text-primary border border-primary rounded-lg p-3 text-sm font-medium transition-all text-left"
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          <button
            onClick={() => { setRescheduleType(null); setFeasibleOptions([]); }}
            className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to options
          </button>
        </>
      ) : (
        <>
          <div className="bg-blue-50 rounded-lg p-4 mb-4 border border-blue-200">
            <h4 className="font-semibold text-gray-900 mb-2">Selected Faculty: {selectedFaculty}</h4>
            <p className="text-sm text-gray-600">Choose change duration:</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => handleDurationSelect(true)}
              className="btn-action btn-state-permanent p-4 text-left"
            >
              <div className="text-lg mb-1">Permanent</div>
              <div className="text-xs opacity-90">Change for all future classes</div>
            </button>
            <button
              onClick={() => handleDurationSelect(false)}
              className="btn-action btn-state-temporary p-4 text-left"
            >
              <div className="text-lg mb-1">Temporary</div>
              <div className="text-xs opacity-90">Change for 7 days only</div>
            </button>
          </div>

          <button
            onClick={() => { setShowDurationChoice(false); setSelectedFaculty(null); setRescheduleType('faculty'); }}
            className="mt-4 w-full py-2 text-gray-600 hover:text-gray-800 font-medium"
          >
            ← Back to faculty selection
          </button>
        </>
      )}
    </Modal>
  )
}
