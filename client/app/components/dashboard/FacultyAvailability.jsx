'use client'

import { useState } from 'react'
import { UserGroupIcon, ClockIcon, CheckIcon } from '@heroicons/react/24/outline'
import { DAYS } from '../../../lib/constants'
import Modal from '@/app/components/shared/Modal'

export default function FacultyAvailability({ extractedData, onSave, initialData = {}, timeSlots = [] }) {
  const [facultyAvailability, setFacultyAvailability] = useState(initialData)
  const [selectedFaculty, setSelectedFaculty] = useState('')
  const [selectedDay, setSelectedDay] = useState(0)
  const [showApplyModal, setShowApplyModal] = useState(false)
  const [pendingDayConfig, setPendingDayConfig] = useState(null)

  const faculty = extractedData?.analytics?.faculty || []
  const slots = timeSlots

  const handleSlotToggle = (facultyName, dayIndex, slotIndex) => {
    setFacultyAvailability(prev => {
      const current = prev[facultyName] || Array(DAYS.length).fill(null).map(() => Array(slots.length).fill(0))
      const updated = current.map((day, dIdx) => 
        dIdx === dayIndex ? day.map((slot, sIdx) => sIdx === slotIndex ? (slot === 1 ? 0 : 1) : slot) : day
      )
      return { ...prev, [facultyName]: updated }
    })
  }

  const handleDayComplete = (facultyName, dayIndex) => {
    const currentConfig = facultyAvailability[facultyName]?.[dayIndex] || Array(slots.length).fill(0)
    setPendingDayConfig({ facultyName, dayIndex, config: currentConfig })
    setShowApplyModal(true)
  }

  const applyToAllDays = () => {
    if (!pendingDayConfig) return
    const { facultyName, config } = pendingDayConfig
    setFacultyAvailability(prev => {
      const current = prev[facultyName] || Array(DAYS.length).fill(null).map(() => Array(slots.length).fill(0))
      const updated = current.map(() => [...config])
      return { ...prev, [facultyName]: updated }
    })
    setShowApplyModal(false)
    setPendingDayConfig(null)
  }

  const applyOnlyToThisDay = () => {
    setShowApplyModal(false)
    setPendingDayConfig(null)
  }

  return (
    <div className="content-card rounded-xl border border-secondary p-6 shadow-md">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6 pb-4 border-b border-secondary">
        <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
          <UserGroupIcon className="h-5 w-5 text-white" />
        </div>
        <div>
          <h3 className="section-title">Faculty Availability</h3>
          <p className="text-sm text-gray-600">Configure time slot availability for each faculty member</p>
        </div>
      </div>

      {/* Faculty Selection */}
      <div className="mb-6">
        <label className="dashboard-label">Select Faculty Member</label>
        <select
          value={selectedFaculty}
          onChange={(e) => setSelectedFaculty(e.target.value)}
          className="dashboard-select focus:ring-2 focus:ring-primary focus:border-primary transition-all"
        >
          <option value="">-- Select Faculty --</option>
          {faculty.map(f => (
            <option key={f.name} value={f.name}>{f.name}</option>
          ))}
        </select>
      </div>

      {/* Time Slot Configuration */}
      {selectedFaculty && (
        <div className="space-y-4 mb-6">
          {/* Day Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {DAYS.map((day, index) => {
              const dayConfig = facultyAvailability[selectedFaculty]?.[index] || Array(slots.length).fill(0)
              const unavailableCount = dayConfig.filter(s => s === 1).length
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDay(index)}
                  className={`px-4 py-2 rounded-lg font-semibold text-sm transition-all whitespace-nowrap ${
                    selectedDay === index
                      ? 'bg-primary text-white shadow-md'
                      : 'content-card text-gray-700 border border-secondary hover:border-primary'
                  }`}
                >
                  {day.slice(0, 3)}
                  {unavailableCount > 0 && (
                    <span className={`ml-2 px-2 py-0.5 rounded-full text-xs ${
                      selectedDay === index ? 'bg-white/20' : 'dashboard-chip-active'
                    }`}>
                      {unavailableCount}
                    </span>
                  )}
                </button>
              )
            })}
          </div>

          {/* Time Slots Grid */}
          <div className="bg-gray-50 rounded-lg border border-secondary p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-primary" />
                <h4 className="font-bold text-gray-800">{DAYS[selectedDay]}</h4>
              </div>
              <button
                onClick={() => handleDayComplete(selectedFaculty, selectedDay)}
                className="dashboard-btn-primary"
              >
                <CheckIcon className="h-4 w-4" />
                Apply to All Days
              </button>
            </div>
            <p className="text-xs text-gray-600 mb-3">Click on time slots to mark as UNAVAILABLE</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {slots.map((slot, slotIndex) => {
                const isUnavailable = facultyAvailability[selectedFaculty]?.[selectedDay]?.[slotIndex] === 1
                return (
                  <button
                    key={slotIndex}
                    onClick={() => handleSlotToggle(selectedFaculty, selectedDay, slotIndex)}
                    className={`px-3 py-2 rounded-lg text-sm font-semibold transition-all border ${
                      isUnavailable ? 'dashboard-chip-active' : 'dashboard-chip-muted'
                    }`}
                  >
                    <div>{slot}</div>
                    <div className="text-xs mt-1">{isUnavailable ? 'Not Avail' : 'Available'}</div>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Configured Faculty Summary */}
      {Object.keys(facultyAvailability).length > 0 && (
        <div className="border border-secondary rounded-lg p-4 mb-4">
          <h4 className="font-bold text-primary mb-3">Configured Faculty ({Object.keys(facultyAvailability).length})</h4>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {Object.entries(facultyAvailability).map(([name, days]) => {
              const totalUnavailable = days.flat().filter(s => s === 1).length
              return (
                <div key={name} className="flex justify-between items-center p-2 bg-gray-50 rounded-lg">
                  <span className="font-semibold text-gray-800 text-sm">{name}</span>
                  <span className="px-3 py-1 rounded text-xs font-semibold dashboard-chip-active">
                    {totalUnavailable} slots unavailable
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={() => onSave(facultyAvailability)}
        className="w-full bg-gradient-primary text-white py-3 rounded-lg font-medium hover:opacity-90 transition-all"
      >
        Save Faculty Availability
      </button>

      {/* Apply to All Days Modal */}
      <Modal
        isOpen={showApplyModal}
        onClose={applyOnlyToThisDay}
        title="Apply to All Days?"
        subtitle={`Apply this ${DAYS[pendingDayConfig?.dayIndex]} configuration to all weekdays?`}
        icon={ClockIcon}
        size="sm"
        footer={
          <>
            <button
              onClick={applyOnlyToThisDay}
              className="dashboard-btn-secondary flex-1"
            >
              Only This Day
            </button>
            <button
              onClick={applyToAllDays}
              className="dashboard-btn-primary flex-1"
            >
              Apply to All Days
            </button>
          </>
        }
      >
        <div className="bg-gray-50 rounded-lg p-4 border border-secondary">
          <p className="text-xs text-gray-700 font-medium mb-2">Current Configuration:</p>
          <div className="flex flex-wrap gap-1">
            {pendingDayConfig?.config.map((slot, idx) => (
              <span key={idx} className={`px-2 py-1 rounded text-xs font-bold border ${
                slot === 1 ? 'dashboard-chip-active' : 'dashboard-chip-muted'
              }`}>
                {slots[idx]}
              </span>
            ))}
          </div>
        </div>
      </Modal>
    </div>
  )
}
