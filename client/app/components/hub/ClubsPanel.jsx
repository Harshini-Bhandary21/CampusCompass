'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Star, Plus, ArrowLeft, Trash2, Image as ImageIcon } from 'lucide-react'
import AnnouncementsPanel from './AnnouncementsPanel'
import ImageCropper from './ImageCropper'
import RoleBadge from './RoleBadge'

function CreateClubForm({ onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [teachers, setTeachers] = useState([])
  const [students, setStudents] = useState([])
  const [coordinatorId, setCoordinatorId] = useState('')
  const [leadId, setLeadId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/users?role=teacher').then(r => r.json()).then(setTeachers).catch(() => {})
    fetch('/api/users?role=student').then(r => r.json()).then(setStudents).catch(() => {})
  }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Club name is required')
    setSubmitting(true)
    try {
      const res = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          facultyCoordinatorRef: coordinatorId ? { id: coordinatorId } : null,
          studentLeadRef: leadId ? { id: leadId } : null,
        }),
      })
      if (!res.ok) throw new Error((await res.json()).error)
      toast.success('Club created')
      onCreated()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dashboard-panel space-y-3">
      <input className="dashboard-select" placeholder="Club name" value={name} onChange={e => setName(e.target.value)} />
      <textarea className="dashboard-select" placeholder="Description" value={description} onChange={e => setDescription(e.target.value)} />
      <select className="dashboard-select" value={coordinatorId} onChange={e => setCoordinatorId(e.target.value)}>
        <option value="">Select faculty coordinator</option>
        {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
      </select>
      <select className="dashboard-select" value={leadId} onChange={e => setLeadId(e.target.value)}>
        <option value="">Select student lead (optional)</option>
        {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
      </select>
      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">Cancel</button>
        <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg disabled:opacity-50">
          {submitting ? 'Creating...' : 'Create Club'}
        </button>
      </div>
    </form>
  )
}

function ClubDetail({ club, role, onBack, onChanged }) {
  const [rawImage, setRawImage] = useState(null)
  const canSetLogo = club.isAdmin || club.isCoordinator || club.isLead
  const canPost = club.isAdmin || club.isCoordinator || club.isLead

  function handleLogoPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRawImage(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function saveLogo(croppedDataUrl) {
    await fetch(`/api/clubs/${club._id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ logo: croppedDataUrl }),
    })
    setRawImage(null)
    onChanged()
  }

  async function deleteClub() {
    if (!window.confirm(`Delete "${club.name}" and all its announcements?`)) return
    await fetch(`/api/clubs/${club._id}`, { method: 'DELETE' })
    toast.success('Club deleted')
    onBack()
    onChanged()
  }

  return (
    <div className="space-y-4">
      {rawImage && <ImageCropper imageSrc={rawImage} aspect={1} onCancel={() => setRawImage(null)} onSave={saveLogo} />}

      <div className="dashboard-panel">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <button onClick={onBack} className="p-1.5 text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /></button>
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center overflow-hidden">
              {club.logo ? <img src={club.logo} alt="" className="w-full h-full object-cover" /> : <Star className="text-primary" size={22} />}
            </div>
            <div>
              <h2 className="font-bold text-lg text-gray-900">{club.name}</h2>
              <p className="text-sm text-gray-500">{club.description}</p>
            </div>
          </div>
          {role === 'admin' && (
            <button onClick={deleteClub} className="p-2 text-gray-400 hover:text-red-500"><Trash2 size={16} /></button>
          )}
        </div>

        <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-600">
          <span>Coordinator: <strong>{club.facultyCoordinator?.name || '—'}</strong></span>
          <span>Student Lead: <strong>{club.studentLead?.name || '—'}</strong></span>
        </div>

        {canSetLogo && (
          <label className="inline-flex items-center gap-1.5 mt-3 text-xs text-primary hover:underline cursor-pointer">
            <ImageIcon size={14} /> {club.logo ? 'Change logo' : 'Upload logo'}
            <input type="file" accept="image/*" hidden onChange={handleLogoPick} />
          </label>
        )}
      </div>

      <AnnouncementsPanel role={role} clubId={club._id} canPost={canPost} />
    </div>
  )
}

export default function ClubsPanel({ role }) {
  const { data: session } = useSession()
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeClubId, setActiveClubId] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/clubs')
      setClubs(await res.json())
    } catch {
      toast.error('Failed to load clubs')
    } finally {
      setLoading(false)
    }
  }

  const activeClub = clubs.find(c => c._id === activeClubId)
  if (activeClub) {
    return <ClubDetail club={activeClub} role={role} onBack={() => setActiveClubId(null)} onChanged={load} />
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="dashboard-panel-title flex items-center gap-2 !mb-0">
          <Star size={20} className="text-primary" /> Clubs
        </h2>
        {role === 'admin' && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={16} /> New Club
          </button>
        )}
      </div>

      {showCreate && <CreateClubForm onCreated={() => { setShowCreate(false); load() }} onCancel={() => setShowCreate(false)} />}

      {loading ? (
        <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading clubs...</p></div>
      ) : clubs.length === 0 ? (
        <div className="dashboard-empty-state">
          <h3 className="dashboard-empty-title">No clubs yet</h3>
          <p className="dashboard-empty-text">{role === 'admin' ? 'Create one to get started.' : 'No clubs have been created yet.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {clubs.map(c => (
            <div key={c._id} onClick={() => setActiveClubId(c._id)} className="dashboard-list-item cursor-pointer hover:border-primary/40 transition-colors relative">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden shrink-0">
                  {c.logo ? <img src={c.logo} alt="" className="w-full h-full object-cover" /> : <Star className="text-primary" size={18} />}
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-gray-900 truncate">{c.name}</h3>
                  <p className="text-xs text-gray-500 truncate">{c.description || 'No description'}</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5 mt-2">
                {c.isCoordinator && <RoleBadge role="teacher" />}
                {c.isLead && <RoleBadge role="clubLead" />}
              </div>
              {c.unreadCount > 0 && (
                <span className="absolute top-3 right-3 bg-red-500 text-white text-[10px] font-bold rounded-full min-w-5 h-5 px-1.5 flex items-center justify-center">
                  {c.unreadCount}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
