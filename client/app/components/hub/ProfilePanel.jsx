'use client'

import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { User, Camera, KeyRound } from 'lucide-react'
import ImageCropper from './ImageCropper'
import ImageViewer from './ImageViewer'
import RoleBadge from './RoleBadge'

function ReadOnlyField({ label, value }) {
  return (
    <div>
      <p className="dashboard-label !mb-1">{label}</p>
      <p className="text-sm text-gray-800">{value || '—'}</p>
    </div>
  )
}

export default function ProfilePanel({ role }) {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [rawImage, setRawImage] = useState(null)
  const [viewingPhoto, setViewingPhoto] = useState(false)
  const [phone, setPhone] = useState('')
  const [about, setAbout] = useState('')
  const [cabinNumber, setCabinNumber] = useState('')
  const [saving, setSaving] = useState(false)
  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' })
  const [pwSaving, setPwSaving] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/users/me')
      const data = await res.json()
      setProfile(data)
      setPhone(data.phone || '')
      setAbout(data.about || '')
      setCabinNumber(data.cabinNumber || '')
    } catch {
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }

  function handlePhotoPick(e) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setRawImage(reader.result)
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  async function savePhoto(croppedDataUrl) {
    await patchSelf({ profilePhoto: croppedDataUrl })
    setRawImage(null)
  }

  async function patchSelf(body) {
    const collection = role === 'teacher' ? 'teachers' : 'students'
    const res = await fetch(`/api/users/${profile._id}?collection=${collection}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    if (!res.ok) throw new Error((await res.json()).error)
    const updated = await res.json()
    setProfile(updated)
    return updated
  }

  async function handleSaveDetails(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const body = role === 'teacher' ? { phone, about, cabinNumber } : { phone, about }
      await patchSelf(body)
      toast.success('Profile updated')
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleChangePassword(e) {
    e.preventDefault()
    if (!pwForm.currentPassword || !pwForm.newPassword) return
    setPwSaving(true)
    try {
      await patchSelf(pwForm)
      toast.success('Password changed')
      setPwForm({ currentPassword: '', newPassword: '' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setPwSaving(false)
    }
  }

  if (loading || !profile) {
    return <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading profile...</p></div>
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <h2 className="dashboard-panel-title flex items-center gap-2">
        <User size={20} className="text-primary" /> Profile
      </h2>

      {rawImage && <ImageCropper imageSrc={rawImage} aspect={1} onCancel={() => setRawImage(null)} onSave={savePhoto} />}
      {viewingPhoto && profile.profilePhoto && (
        <ImageViewer src={profile.profilePhoto} alt={profile.name} onClose={() => setViewingPhoto(false)} />
      )}

      <div className="dashboard-panel flex items-center gap-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden cursor-pointer"
            onClick={() => profile.profilePhoto && setViewingPhoto(true)}
          >
            {profile.profilePhoto ? (
              <img src={profile.profilePhoto} alt={profile.name} className="w-full h-full object-cover" />
            ) : (
              <span className="text-2xl font-bold text-primary">{profile.name?.[0]?.toUpperCase()}</span>
            )}
          </div>
          <label className="absolute -bottom-1 -right-1 p-1.5 bg-gradient-primary text-white rounded-full cursor-pointer shadow-lg">
            <Camera size={14} />
            <input type="file" accept="image/*" hidden onChange={handlePhotoPick} />
          </label>
        </div>
        <div>
          <h3 className="font-bold text-gray-900">{profile.name}</h3>
          <RoleBadge role={role} />
        </div>
      </div>

      <div className="dashboard-panel grid grid-cols-1 sm:grid-cols-2 gap-4">
        <ReadOnlyField label="Email" value={profile.email} />
        <ReadOnlyField label="Department" value={profile.department} />
        {role === 'student' && <ReadOnlyField label="PRN" value={profile.prn} />}
        {role === 'student' && <ReadOnlyField label="Semester" value={profile.semester} />}
        {role === 'teacher' && <ReadOnlyField label="Designation" value={profile.designation} />}
        {role === 'admin' && <ReadOnlyField label="University" value={profile.university} />}
        <p className="sm:col-span-2 text-xs text-gray-400">Core details are managed by your administrator.</p>
      </div>

      {role !== 'admin' && (
        <form onSubmit={handleSaveDetails} className="dashboard-panel space-y-3">
          <p className="dashboard-panel-title !mb-2 !text-base">Contact & Bio</p>
          <div>
            <p className="dashboard-label !mb-1">Phone</p>
            <input className="dashboard-select" value={phone} onChange={e => setPhone(e.target.value)} placeholder="Phone number" />
          </div>
          {role === 'teacher' && (
            <div>
              <p className="dashboard-label !mb-1">Cabin Number</p>
              <input className="dashboard-select" value={cabinNumber} onChange={e => setCabinNumber(e.target.value)} placeholder="e.g. C-204" />
            </div>
          )}
          <div>
            <p className="dashboard-label !mb-1">About</p>
            <textarea
              className="dashboard-select min-h-[90px]"
              value={about}
              maxLength={500}
              onChange={e => setAbout(e.target.value)}
              placeholder="A short bio (max 500 characters)"
            />
          </div>
          <div className="flex justify-end">
            <button type="submit" disabled={saving} className="dashboard-btn-primary">
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      )}

      <form onSubmit={handleChangePassword} className="dashboard-panel space-y-3">
        <p className="dashboard-panel-title !mb-2 !text-base flex items-center gap-2"><KeyRound size={16} /> Change Password</p>
        <input
          type="password"
          className="dashboard-select"
          placeholder="Current password"
          value={pwForm.currentPassword}
          onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))}
        />
        <input
          type="password"
          className="dashboard-select"
          placeholder="New password"
          value={pwForm.newPassword}
          onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))}
        />
        <div className="flex justify-end">
          <button type="submit" disabled={pwSaving} className="dashboard-btn-primary">
            {pwSaving ? 'Saving...' : 'Update Password'}
          </button>
        </div>
      </form>
    </div>
  )
}
