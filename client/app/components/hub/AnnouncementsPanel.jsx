'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Megaphone, Plus, Paperclip, X, Pencil, Trash2 } from 'lucide-react'
import AttachmentViewer from './AttachmentViewer'
import PollCreator from './PollCreator'
import PollDisplay from './PollDisplay'
import ExpirySelector, { getExpiryLabel, calculateExpiryDate } from './ExpirySelector'
import RoleBadge from './RoleBadge'

const MAX_FILE_BYTES = 5 * 1024 * 1024

function fileToAttachment(file) {
  return new Promise((resolve, reject) => {
    if (file.size > MAX_FILE_BYTES) {
      reject(new Error(`"${file.name}" is larger than 5MB`))
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      const type = file.type.startsWith('image/') ? 'image' : file.type === 'application/pdf' ? 'pdf' : 'file'
      resolve({ name: file.name, type, mimeType: file.type, data: reader.result })
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

const TARGET_LABELS = { all: 'Everyone', students: 'Students only', teachers: 'Teachers only', department: 'Department' }

/**
 * @param {'student'|'teacher'|'admin'} role
 * @param {string} [clubId] - when set, this panel shows/creates club-scoped announcements instead of global ones
 * @param {boolean} [canPost] - overrides the default role-based posting permission (used for club coordinators/leads)
 */
export default function AnnouncementsPanel({ role, clubId, canPost }) {
  const { data: session } = useSession()
  const [announcements, setAnnouncements] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ title: '', content: '', target: 'all', attachments: [], expiresAt: 'never', poll: null })
  const [submitting, setSubmitting] = useState(false)

  const allowedToPost = canPost !== undefined ? canPost : role === 'teacher' || role === 'admin'

  useEffect(() => {
    load()
  }, [clubId])

  async function load() {
    setLoading(true)
    try {
      const qs = clubId ? `scope=club&clubId=${clubId}` : 'scope=global&limit=50'
      const res = await fetch(`/api/announcements?${qs}`)
      const data = await res.json()
      setAnnouncements(data.announcements || [])
    } catch {
      toast.error('Failed to load announcements')
    } finally {
      setLoading(false)
    }
  }

  function resetForm() {
    setForm({ title: '', content: '', target: 'all', attachments: [], expiresAt: 'never', poll: null })
    setEditingId(null)
    setShowForm(false)
  }

  async function handleFilePick(e) {
    const files = Array.from(e.target.files || [])
    if (form.attachments.length + files.length > 5) {
      toast.error('Max 5 attachments per post')
      return
    }
    try {
      const converted = await Promise.all(files.map(fileToAttachment))
      setForm(f => ({ ...f, attachments: [...f.attachments, ...converted] }))
    } catch (err) {
      toast.error(err.message)
    }
    e.target.value = ''
  }

  function removeAttachment(idx) {
    setForm(f => ({ ...f, attachments: f.attachments.filter((_, i) => i !== idx) }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setSubmitting(true)
    try {
      const payload = {
        title: form.title,
        content: form.content,
        attachments: form.attachments,
        expiresAt: form.expiresAt === 'never' ? null : calculateExpiryDate(form.expiresAt),
        poll: form.poll?.question ? form.poll : null,
      }
      if (clubId) {
        payload.scope = 'club'
        payload.clubId = clubId
      } else {
        payload.scope = 'global'
        payload.target = form.target
      }

      if (editingId) {
        await fetch('/api/announcements', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ announcementId: editingId, title: form.title, content: form.content, target: form.target }),
        })
        toast.success('Announcement updated')
      } else {
        const res = await fetch('/api/announcements', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || 'Failed to post')
        }
        toast.success('Announcement posted')
      }
      resetForm()
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  function startEdit(a) {
    setEditingId(a._id)
    setForm({ title: a.title, content: a.content, target: a.target, attachments: [], expiresAt: 'never', poll: null })
    setShowForm(true)
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this announcement?')) return
    await fetch(`/api/announcements?id=${id}`, { method: 'DELETE' })
    toast.success('Announcement deleted')
    load()
  }

  async function handleVote(announcementId, optionId) {
    const res = await fetch(`/api/announcements/${announcementId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    })
    const updated = await res.json()
    setAnnouncements(prev => prev.map(a => (a._id === updated._id ? updated : a)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="dashboard-panel-title flex items-center gap-2 !mb-0">
          <Megaphone size={20} className="text-primary" /> Announcements
        </h2>
        {allowedToPost && !showForm && (
          <button
            onClick={() => setShowForm(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg hover:shadow-lg transition-all"
          >
            <Plus size={16} /> New Announcement
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="dashboard-panel space-y-3">
          <input
            className="dashboard-select"
            placeholder="Title"
            value={form.title}
            onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
          />
          <textarea
            className="dashboard-select min-h-[100px]"
            placeholder="What do you want to share?"
            value={form.content}
            onChange={e => setForm(f => ({ ...f, content: e.target.value }))}
          />

          {!clubId && (
            <select
              className="dashboard-select"
              value={form.target}
              onChange={e => setForm(f => ({ ...f, target: e.target.value }))}
            >
              {Object.entries(TARGET_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}

          {!editingId && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex items-center gap-1.5 px-3 py-2 text-sm border border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <Paperclip size={14} /> Attach files
                  <input type="file" multiple hidden onChange={handleFilePick} />
                </label>
                <ExpirySelector value={form.expiresAt} onChange={v => setForm(f => ({ ...f, expiresAt: v }))} />
              </div>

              {form.attachments.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {form.attachments.map((att, idx) => (
                    <span key={idx} className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-3 py-1">
                      {att.name}
                      <button type="button" onClick={() => removeAttachment(idx)}><X size={12} /></button>
                    </span>
                  ))}
                </div>
              )}

              <PollCreator poll={form.poll} onChange={p => setForm(f => ({ ...f, poll: p }))} />
            </>
          )}

          <div className="flex justify-end gap-2 pt-1">
            <button type="button" onClick={resetForm} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={submitting} className="px-4 py-2 text-sm font-semibold text-white bg-gradient-primary rounded-lg disabled:opacity-50">
              {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Post'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="dashboard-empty-state">
          <p className="dashboard-empty-text">Loading announcements...</p>
        </div>
      ) : announcements.length === 0 ? (
        <div className="dashboard-empty-state">
          <h3 className="dashboard-empty-title">No announcements yet</h3>
          <p className="dashboard-empty-text">Check back later for updates.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map(a => {
            const isOwn = a.author?.id === session?.user?.id
            const canManage = role === 'admin' || isOwn
            const expiryLabel = getExpiryLabel(a.expiresAt)
            return (
              <div key={a._id} className="dashboard-list-item space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    {a.title && <h3 className="font-semibold text-gray-900">{a.title}</h3>}
                    <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                      <span>{a.author?.name || a.author?.email}</span>
                      <RoleBadge role={a.author?.role} />
                      <span>&middot;</span>
                      <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                      {expiryLabel && <span className="text-amber-600">&middot; {expiryLabel}</span>}
                    </div>
                  </div>
                  {canManage && (
                    <div className="flex gap-1 shrink-0">
                      {isOwn && !clubId && (
                        <button onClick={() => startEdit(a)} className="p-1.5 text-gray-400 hover:text-primary transition-colors">
                          <Pencil size={14} />
                        </button>
                      )}
                      <button onClick={() => handleDelete(a._id)} className="p-1.5 text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )}
                </div>
                {a.content && <p className="text-sm text-gray-700 whitespace-pre-wrap">{a.content}</p>}
                <AttachmentViewer attachments={a.attachments} />
                {a.poll && (
                  <PollDisplay poll={a.poll} userId={session?.user?.id} onVote={optionId => handleVote(a._id, optionId)} />
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
