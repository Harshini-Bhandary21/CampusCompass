'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { DocumentArrowUpIcon, CheckCircleIcon, TrashIcon } from '@heroicons/react/24/outline'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import IconBadge from '@/app/components/dashboard/IconBadge'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'

export default function AdminCalendarPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [calendar, setCalendar] = useState(null)
  const [loading, setLoading] = useState(true)
  const [file, setFile] = useState(null)
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  useEffect(() => {
    if (session?.user.role === 'admin') load()
  }, [session])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/calendar')
      setCalendar(await res.json())
    } finally {
      setLoading(false)
    }
  }

  function handleFileSelect(selected) {
    if (!selected) return
    const isPdf = selected.type === 'application/pdf'
    const isImage = selected.type.startsWith('image/')
    if (!isPdf && !isImage) {
      toast.error('Please select a PDF or image file')
      return
    }
    setFile(selected)
  }

  async function handleUpload(e) {
    e.preventDefault()
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const method = calendar ? 'PUT' : 'POST'
      const res = await fetch('/api/calendar', { method, body: formData })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(calendar ? 'Calendar replaced' : 'Calendar uploaded')
      setFile(null)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete the active academic calendar?')) return
    await fetch('/api/calendar', { method: 'DELETE' })
    toast.success('Calendar deleted')
    load()
  }

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading calendar..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="calendar"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />
      <div className="flex-1 lg:ml-0 min-w-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="Academic Calendar"
        />
        <div className="p-4 space-y-4">
          <div className="dashboard-panel flex items-center gap-3">
            <IconBadge icon={DocumentArrowUpIcon} />
            <div>
              <h2 className="text-lg font-bold dark-text">Academic Calendar</h2>
              <p className="dashboard-empty-text text-sm">Upload and manage the department's academic calendar</p>
            </div>
          </div>

          <form onSubmit={handleUpload} className="dashboard-panel">
            <div
              className={`relative border-2 border-dashed rounded-2xl p-8 text-center transition-all ${
                isDragging ? 'border-primary bg-primary/5' : 'border-primary/30 hover:border-primary'
              }`}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={e => {
                e.preventDefault()
                setIsDragging(false)
                if (e.dataTransfer.files?.[0]) handleFileSelect(e.dataTransfer.files[0])
              }}
            >
              <div className="bg-gradient-primary w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                <DocumentArrowUpIcon className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-bold text-gray-800 mb-1">
                {calendar ? 'Replace the active calendar' : 'Upload the academic calendar'}
              </h3>
              <p className="text-sm text-gray-500 mb-4">Drop a PDF or image here, or click to browse</p>

              <label htmlFor="calendar-upload" className="cursor-pointer inline-block">
                <div
                  className={`inline-flex items-center px-5 py-2.5 rounded-xl border-2 text-sm font-semibold transition-all ${
                    file ? 'bg-green-50 border-green-400 text-green-700' : 'bg-white border-gray-300 text-gray-700 hover:border-primary'
                  }`}
                >
                  {file ? (
                    <><CheckCircleIcon className="h-5 w-5 mr-2 text-green-500" /> {file.name}</>
                  ) : (
                    <><DocumentArrowUpIcon className="h-5 w-5 mr-2" /> Choose file</>
                  )}
                </div>
                <input
                  id="calendar-upload"
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={e => handleFileSelect(e.target.files[0])}
                />
              </label>

              <div className="mt-4">
                <button
                  type="submit"
                  disabled={!file || uploading}
                  className="px-6 py-2.5 rounded-xl font-bold text-sm text-white bg-gradient-primary shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {uploading ? 'Uploading...' : calendar ? 'Replace Calendar' : 'Upload Calendar'}
                </button>
              </div>
            </div>
          </form>

          {loading ? (
            <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading current calendar...</p></div>
          ) : calendar ? (
            <div className="dashboard-panel">
              <div className="flex items-center justify-between mb-3">
                <h3 className="dashboard-panel-title !mb-0">Currently active: {calendar.fileName}</h3>
                <button onClick={handleDelete} className="p-2 text-gray-400 hover:text-red-500">
                  <TrashIcon className="h-5 w-5" />
                </button>
              </div>
              {/\.(png|jpe?g|gif|webp)$/i.test(calendar.fileName || '') ? (
                <img src={calendar.fileUrl} alt={calendar.fileName} className="w-full rounded-lg" />
              ) : (
                <iframe src={calendar.fileUrl} title="Academic Calendar" className="w-full h-[60vh] rounded-lg border border-gray-200" />
              )}
            </div>
          ) : (
            <div className="dashboard-empty-state">
              <h3 className="dashboard-empty-title">No calendar uploaded yet</h3>
              <p className="dashboard-empty-text">Upload one above so students and faculty can view it.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
