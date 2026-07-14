'use client'

export default function ConfigReview({ onlineConfig, facultyAvailability, onConfirm, onBack }) {
  const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-primary/10 rounded-xl border border-primary/30 p-4">
      <h3 className="text-sm font-bold text-primary mb-4">Review Configuration</h3>

      <div className="space-y-4">
        {/* Online Config */}
        <div className="bg-white rounded-lg p-3 border border-secondary">
          <h4 className="text-xs font-bold text-primary mb-2">Online Configuration</h4>
          <div className="text-[10px] text-gray-600">
            <div>FY Online: {onlineConfig?.FY?.map((v, i) => v === 1 ? DAYS[i] : null).filter(Boolean).join(', ') || 'None'}</div>
          </div>
        </div>

        {/* Faculty Availability */}
        {facultyAvailability && Object.keys(facultyAvailability).length > 0 && (
          <div className="bg-white rounded-lg p-3 border border-secondary">
            <h4 className="text-xs font-bold text-primary mb-2">Faculty Availability ({Object.keys(facultyAvailability).length} faculty)</h4>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {Object.entries(facultyAvailability).slice(0, 5).map(([name, days]) => {
                const unavailableDays = days.map((val, idx) => val === 1 ? DAYS[idx] : null).filter(Boolean)
                return (
                  <div key={name} className="flex justify-between text-[10px]">
                    <span className="font-medium text-gray-700">{name}</span>
                    <span className="text-red-600">{unavailableDays.join(', ') || 'All available'}</span>
                  </div>
                )
              })}
              {Object.keys(facultyAvailability).length > 5 && (
                <div className="text-[10px] text-gray-500">+{Object.keys(facultyAvailability).length - 5} more...</div>
              )}
            </div>
          </div>
        )}

      </div>

      <div className="flex gap-2 mt-4">
        <button
          onClick={onBack}
          className="dashboard-btn-secondary flex-1"
        >
          Back
        </button>
        <button
          onClick={onConfirm}
          className="dashboard-btn-primary flex-1"
        >
          Confirm & Generate
        </button>
      </div>
    </div>
  )
}
