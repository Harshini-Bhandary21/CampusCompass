'use client'

import { useEffect, useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import toast from 'react-hot-toast'
import { Users, Plus, Send, Paperclip, X, Star, Trash2, ArrowLeft, ChevronDown } from 'lucide-react'
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

function CreateGroupForm({ onCreated, onCancel }) {
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [messagingMode, setMessagingMode] = useState('open')
  const [candidates, setCandidates] = useState([])
  const [selected, setSelected] = useState([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    fetch('/api/users').then(r => r.json()).then(setCandidates).catch(() => {})
  }, [])

  function toggle(user) {
    const key = `${user.role}:${user._id}`
    setSelected(prev =>
      prev.some(s => s.key === key)
        ? prev.filter(s => s.key !== key)
        : [...prev, { key, id: user._id, collection: user.role === 'teacher' ? 'teachers' : 'students', name: user.name }]
    )
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return toast.error('Group name is required')
    setSubmitting(true)
    try {
      const res = await fetch('/api/groups', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          messagingMode,
          memberRefs: selected.map(s => ({ id: s.id, collection: s.collection })),
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      toast.success('Group created')
      onCreated()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="dashboard-panel space-y-3">
      <input className="dashboard-select" placeholder="Group name" value={name} onChange={e => setName(e.target.value)} />
      <textarea className="dashboard-select" placeholder="Description (optional)" value={description} onChange={e => setDescription(e.target.value)} />
      <select className="dashboard-select" value={messagingMode} onChange={e => setMessagingMode(e.target.value)}>
        <option value="open">Open messaging (any member can post)</option>
        <option value="restricted">Restricted (teachers + leads only)</option>
      </select>

      <div>
        <p className="dashboard-label !mb-2">Members (must include at least one teacher)</p>
        <div className="max-h-56 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
          {candidates.map(u => (
            <label key={`${u.role}:${u._id}`} className="flex items-center gap-2 px-3 py-2 text-sm cursor-pointer hover:bg-gray-50">
              <input
                type="checkbox"
                checked={selected.some(s => s.key === `${u.role}:${u._id}`)}
                onChange={() => toggle(u)}
              />
              <span className="flex-1">{u.name}</span>
              <RoleBadge role={u.role} />
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-1">
        <button type="button" onClick={onCancel} className="dashboard-btn-secondary">Cancel</button>
        <button type="submit" disabled={submitting} className="dashboard-btn-primary">
          {submitting ? 'Creating...' : 'Create Group'}
        </button>
      </div>
    </form>
  )
}

function GroupChat({ group, role, session, onBack, onChanged }) {
  const [messages, setMessages] = useState([])
  const [content, setContent] = useState('')
  const [attachments, setAttachments] = useState([])
  const [expiresAt, setExpiresAt] = useState('never')
  const [poll, setPoll] = useState(null)
  const [showPoll, setShowPoll] = useState(false)
  const [sending, setSending] = useState(false)
  const bottomRef = useRef(null)

  const isMember = group.members?.some(m => m.id === session?.user?.id)
  const isLead = group.members?.some(m => m.id === session?.user?.id && m.isLead)
  const canManage = role === 'admin' || (role === 'teacher' && isMember)
  const canMessage = role === 'admin' || (role === 'teacher' && isMember) || (group.messagingMode === 'open' && isMember) || isLead

  useEffect(() => {
    load()
  }, [group._id])

  async function load() {
    const res = await fetch(`/api/groups/${group._id}/messages`)
    const data = await res.json()
    setMessages(Array.isArray(data) ? data : [])
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
  }

  async function handleFilePick(e) {
    const files = Array.from(e.target.files || [])
    try {
      const converted = await Promise.all(files.map(fileToAttachment))
      setAttachments(prev => [...prev, ...converted])
    } catch (err) {
      toast.error(err.message)
    }
    e.target.value = ''
  }

  async function send() {
    if (!content.trim() && attachments.length === 0 && !poll?.question) return
    setSending(true)
    try {
      const res = await fetch(`/api/groups/${group._id}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          content,
          attachments,
          expiresAt: expiresAt === 'never' ? null : calculateExpiryDate(expiresAt),
          poll: poll?.question ? poll : null,
        }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error)
      }
      setContent('')
      setAttachments([])
      setExpiresAt('never')
      setPoll(null)
      setShowPoll(false)
      load()
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSending(false)
    }
  }

  async function deleteMessage(messageId) {
    if (!window.confirm('Delete this message?')) return
    await fetch(`/api/groups/${group._id}/messages?messageId=${messageId}`, { method: 'DELETE' })
    load()
  }

  async function vote(messageId, optionId) {
    const res = await fetch(`/api/groups/${group._id}/messages/${messageId}/vote`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ optionId }),
    })
    const updated = await res.json()
    setMessages(prev => prev.map(m => (m._id === updated._id ? updated : m)))
  }

  async function toggleLead(member) {
    const isCurrentlyLead = member.isLead
    await fetch('/api/groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        groupId: group._id,
        [isCurrentlyLead ? 'revokeLeadRef' : 'leadRef']: { id: member.id, collection: member.collection },
      }),
    })
    onChanged()
  }

  async function changeMode(mode) {
    await fetch('/api/groups', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ groupId: group._id, messagingMode: mode }),
    })
    onChanged()
  }

  return (
    <div className="dashboard-panel flex flex-col h-[70vh]">
      <div className="flex items-center justify-between pb-3 border-b border-gray-100 mb-3">
        <div className="flex items-center gap-2">
          <button onClick={onBack} className="p-1.5 text-gray-500 hover:text-gray-800"><ArrowLeft size={16} /></button>
          <div>
            <h3 className="font-semibold text-gray-900">{group.name}</h3>
            <p className="text-xs text-gray-400">{group.members?.length || 0} members &middot; {group.messagingMode} messaging</p>
          </div>
        </div>
        {canManage && (
          <select className="text-xs border border-gray-300 rounded-lg px-2 py-1" value={group.messagingMode} onChange={e => changeMode(e.target.value)}>
            <option value="open">Open</option>
            <option value="restricted">Restricted</option>
          </select>
        )}
      </div>

      {canManage && (
        <details className="mb-3 text-sm">
          <summary className="cursor-pointer text-gray-500 flex items-center gap-1"><ChevronDown size={14} /> Manage members</summary>
          <div className="mt-2 space-y-1">
            {group.members?.map(m => (
              <div key={m.id} className="flex items-center justify-between px-2 py-1 rounded hover:bg-gray-50">
                <span className="flex items-center gap-2">
                  {m.name} <RoleBadge role={m.isLead ? 'clubLead' : m.role} />
                </span>
                {m.role === 'student' && (
                  <button onClick={() => toggleLead(m)} className="text-xs text-primary hover:underline flex items-center gap-1">
                    <Star size={12} /> {m.isLead ? 'Revoke lead' : 'Make lead'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </details>
      )}

      <div className="flex-1 overflow-y-auto space-y-3 pr-1">
        {messages.length === 0 ? (
          <p className="dashboard-empty-text text-center py-8">No messages yet — say hello!</p>
        ) : (
          messages.map(m => {
            const mine = m.sender?.id === session?.user?.id
            return (
              <div key={m._id} className={`max-w-[80%] ${mine ? 'ml-auto text-right' : ''}`}>
                <div className={`flex items-center gap-2 text-xs text-gray-400 mb-0.5 ${mine ? 'justify-end' : ''}`}>
                  <span>{m.sender?.name}</span>
                  <RoleBadge role={m.sender?.role} />
                  <span>{new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className={`inline-block rounded-lg px-3 py-2 text-sm text-left ${mine ? 'chat-bubble-mine' : 'chat-bubble-theirs'}`}>
                  {m.content && <p className="whitespace-pre-wrap">{m.content}</p>}
                  {m.attachments?.length > 0 && <div className="mt-1"><AttachmentViewer attachments={m.attachments} /></div>}
                  {m.poll && (
                    <div className="mt-1 text-gray-800">
                      <PollDisplay poll={m.poll} userId={session?.user?.id} onVote={optionId => vote(m._id, optionId)} />
                    </div>
                  )}
                  {getExpiryLabel(m.expiresAt) && <p className="text-[10px] mt-1 opacity-70">{getExpiryLabel(m.expiresAt)}</p>}
                </div>
                {(mine || role === 'admin' || isLead) && (
                  <button onClick={() => deleteMessage(m._id)} className="text-[10px] text-gray-400 hover:text-red-500 mt-0.5">
                    <Trash2 size={10} className="inline" /> delete
                  </button>
                )}
              </div>
            )
          }
          )
        )}
        <div ref={bottomRef} />
      </div>

      {canMessage ? (
        <div className="pt-3 border-t border-gray-100 mt-3 space-y-2">
          {showPoll && <PollCreator poll={poll} onChange={setPoll} />}
          {attachments.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {attachments.map((att, idx) => (
                <span key={idx} className="flex items-center gap-1 text-xs bg-gray-100 rounded-full px-3 py-1">
                  {att.name}
                  <button onClick={() => setAttachments(prev => prev.filter((_, i) => i !== idx))}><X size={12} /></button>
                </span>
              ))}
            </div>
          )}
          <div className="flex items-center gap-2">
            <label className="p-2 text-gray-500 hover:text-primary cursor-pointer">
              <Paperclip size={18} />
              <input type="file" multiple hidden onChange={handleFilePick} />
            </label>
            <ExpirySelector value={expiresAt} onChange={setExpiresAt} />
            <button type="button" onClick={() => setShowPoll(s => !s)} className="text-xs text-gray-500 hover:text-primary">Poll</button>
            <input
              className="flex-1 dashboard-select"
              placeholder="Type a message..."
              value={content}
              onChange={e => setContent(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && send()}
            />
            <button onClick={send} disabled={sending} className="p-2.5 text-white bg-gradient-primary rounded-lg disabled:opacity-50">
              <Send size={16} />
            </button>
          </div>
        </div>
      ) : (
        <p className="text-xs text-gray-400 text-center pt-3 border-t border-gray-100 mt-3">Messaging is restricted in this group.</p>
      )}
    </div>
  )
}

export default function GroupsPanel({ role }) {
  const { data: session } = useSession()
  const [groups, setGroups] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeGroup, setActiveGroup] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch('/api/groups')
      const data = await res.json()
      setGroups(Array.isArray(data) ? data : [])
    } catch {
      toast.error('Failed to load groups')
    } finally {
      setLoading(false)
    }
  }

  async function deleteGroup(id) {
    if (!window.confirm('Delete this group? This cannot be undone.')) return
    await fetch(`/api/groups?id=${id}`, { method: 'DELETE' })
    toast.success('Group deleted')
    load()
  }

  if (activeGroup) {
    return (
      <GroupChat
        group={groups.find(g => g._id === activeGroup) || { _id: activeGroup }}
        role={role}
        session={session}
        onBack={() => setActiveGroup(null)}
        onChanged={load}
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="dashboard-panel-title flex items-center gap-2 !mb-0">
          <Users size={20} className="text-primary" /> Groups
        </h2>
        {role === 'admin' && !showCreate && (
          <button
            onClick={() => setShowCreate(true)}
            className="dashboard-btn-primary"
          >
            <Plus size={16} /> New Group
          </button>
        )}
      </div>

      {showCreate && <CreateGroupForm onCreated={() => { setShowCreate(false); load() }} onCancel={() => setShowCreate(false)} />}

      {loading ? (
        <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading groups...</p></div>
      ) : groups.length === 0 ? (
        <div className="dashboard-empty-state">
          <h3 className="dashboard-empty-title">No groups yet</h3>
          <p className="dashboard-empty-text">{role === 'admin' ? 'Create one to get started.' : 'You have not been added to any groups yet.'}</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {groups.map(g => (
            <div key={g._id} onClick={() => setActiveGroup(g._id)} className="dashboard-list-item cursor-pointer hover:border-primary/40 transition-colors relative">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-gray-900">{g.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{g.description || 'No description'}</p>
                  <p className="text-xs text-gray-400 mt-2">{g.members?.length || 0} members</p>
                </div>
                {g.unreadCount > 0 && (
                  <span className="dashboard-unread-badge">
                    {g.unreadCount}
                  </span>
                )}
              </div>
              {role === 'admin' && (
                <button
                  onClick={e => { e.stopPropagation(); deleteGroup(g._id) }}
                  className="absolute top-3 right-3 p-1 text-gray-300 hover:text-red-500"
                >
                  <Trash2 size={14} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
