'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { UserPlus, Upload, CheckCircle } from 'lucide-react'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import IconBadge from '@/app/components/dashboard/IconBadge'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import { parseCsv } from '@/lib/csv'

function RoleToggle({ role, onChange }) {
  return (
    <div className="flex gap-2">
      {[['student', 'Student'], ['teacher', 'Teacher']].map(([value, label]) => (
        <button
          key={value}
          type="button"
          onClick={() => onChange(value)}
          className={`px-4 py-1.5 rounded-full text-sm font-semibold border transition-colors ${
            role === value ? 'bg-primary text-white border-primary' : 'border-gray-300 text-gray-600 hover:border-primary'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}

function ManualEntryForm({ onCreated }) {
  const [role, setRole] = useState('student')
  const [form, setForm] = useState({ name: '', email: '', department: '', prn: '', semester: '', designation: '' })
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, role }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success(`${role === 'student' ? 'Student' : 'Teacher'} account created — default password is their ${role === 'student' ? 'PRN' : 'email address'}.`)
      setForm({ name: '', email: '', department: '', prn: '', semester: '', designation: '' })
      onCreated()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dashboard-panel space-y-3">
      <p className="dashboard-panel-title flex items-center gap-2 !mb-2">
        <UserPlus size={18} className="text-primary" /> Manual Entry
      </p>
      <RoleToggle role={role} onChange={setRole} />
      <input className="dashboard-select" placeholder="Full name" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
      <input className="dashboard-select" type="email" placeholder="Email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required />
      <input className="dashboard-select" placeholder="Department" value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))} />
      {role === 'student' ? (
        <>
          <input className="dashboard-select" placeholder="PRN" value={form.prn} onChange={e => setForm(f => ({ ...f, prn: e.target.value }))} required />
          <input className="dashboard-select" type="number" placeholder="Semester" value={form.semester} onChange={e => setForm(f => ({ ...f, semester: e.target.value }))} />
        </>
      ) : (
        <input className="dashboard-select" placeholder="Designation" value={form.designation} onChange={e => setForm(f => ({ ...f, designation: e.target.value }))} />
      )}
      <p className="text-xs text-gray-400">
        Default password: {role === 'student' ? "the student's PRN" : "the teacher's email address"}.
      </p>
      <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg disabled:opacity-50">
        {submitting ? 'Creating...' : 'Create Account'}
      </button>
    </form>
  )
}

function BulkCsvForm() {
  const [role, setRole] = useState('student')
  const [rows, setRows] = useState([])
  const [fileName, setFileName] = useState('')
  const [result, setResult] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  function handleFile(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name)
    setResult(null)
    const reader = new FileReader()
    reader.onload = () => setRows(parseCsv(reader.result))
    reader.readAsText(file)
  }

  async function handleUpload() {
    if (rows.length === 0) return toast.error('No rows parsed from this CSV')
    setSubmitting(true)
    try {
      const res = await fetch('/api/load-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role, users: rows }),
      })
      const data = await res.json()
      setResult(data)
      if (res.ok) toast.success(data.message)
    } catch {
      toast.error('Bulk upload failed')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="dashboard-panel space-y-3">
      <p className="dashboard-panel-title flex items-center gap-2 !mb-2">
        <Upload size={18} className="text-primary" /> Bulk Upload (CSV)
      </p>
      <p className="text-xs text-gray-500">
        Columns recognized (any order, flexible naming): name, email, department, prn, semester (students), designation (teachers).
      </p>
      <div className="flex gap-3 items-center flex-wrap">
        <RoleToggle role={role} onChange={setRole} />
        <label className="px-4 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50">
          {fileName || 'Choose CSV file'}
          <input type="file" accept=".csv" hidden onChange={handleFile} />
        </label>
        {rows.length > 0 && (
          <span className="text-xs text-gray-500 flex items-center gap-1"><CheckCircle size={12} className="text-green-500" /> {rows.length} rows parsed</span>
        )}
      </div>
      <button
        onClick={handleUpload}
        disabled={rows.length === 0 || submitting}
        className="px-4 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg disabled:opacity-50"
      >
        {submitting ? 'Uploading...' : 'Upload'}
      </button>

      {result && (
        <div className="mt-2 text-sm space-y-2">
          <p className="font-semibold text-gray-800">{result.created} created, {result.skipped} skipped</p>
          {result.errors?.length > 0 && (
            <div className="max-h-40 overflow-y-auto space-y-1">
              {result.errors.map((e, i) => (
                <p key={i} className="text-xs text-red-600">Row {e.row}: {e.error}</p>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default function AdminBulkLoadPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="bulk-load"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />
      <div className="flex-1 lg:ml-0 min-w-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="Bulk Load"
        />
        <div className="p-4 space-y-4">
          <div className="dashboard-panel flex items-center gap-3">
            <IconBadge icon={Upload} />
            <div>
              <h2 className="text-lg font-bold dark-text">Bulk Load</h2>
              <p className="dashboard-empty-text text-sm">Provision teacher and student accounts one at a time or via CSV upload</p>
            </div>
          </div>

          <ManualEntryForm onCreated={() => {}} />
          <BulkCsvForm />
        </div>
      </div>
    </div>
  )
}
