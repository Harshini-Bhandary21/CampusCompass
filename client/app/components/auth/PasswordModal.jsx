'use client'

import { useState } from 'react'
import { LockClosedIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Modal from '@/app/components/shared/Modal'

export default function PasswordModal({ isOpen, onClose, onVerify, departmentName }) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const response = await fetch('/api/coordinators/verify-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ department: departmentName, password })
      })

      const data = await response.json()

      if (data.success) {
        onVerify()
        setPassword('')
        onClose()
      } else {
        setError(data.message || 'Invalid password')
      }
    } catch (err) {
      setError('Failed to verify password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Password Required" icon={LockClosedIcon} size="sm">
      <p className="text-gray-600 mb-4">
        Enter your login password to download the schedule.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="relative mb-4">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your login password"
            className="w-full px-4 py-3 pr-12 border-2 border-gray-300 rounded-lg focus:border-primary focus:outline-none"
            autoFocus
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
          >
            {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-2 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="dashboard-btn-secondary flex-1"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!password || loading}
            className="dashboard-btn-primary flex-1"
          >
            {loading ? 'Verifying...' : 'Verify'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
