'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Search, Pencil, Ban, CheckCircle, Trash2, Save, X } from 'lucide-react'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import RoleBadge from '@/app/components/hub/RoleBadge'

export default function AdminUsersPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('active')
  const [editingKey, setEditingKey] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  useEffect(() => {
    if (session?.user.role === 'admin') load()
  }, [session, roleFilter, statusFilter])

  async function load() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (roleFilter) params.set('role', roleFilter)
      if (statusFilter) params.set('status', statusFilter)
      const res = await fetch(`/api/users?${params}`)
      setUsers(await res.json())
    } catch {
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.prn?.toLowerCase().includes(search.toLowerCase())
  )

  function startEdit(u) {
    setEditingKey(`${u.role}:${u._id}`)
    setEditForm({ name: u.name, department: u.department, phone: u.phone || '', designation: u.designation || '', prn: u.prn || '', semester: u.semester || '' })
  }

  async function saveEdit(u) {
    const collection = u.role === 'teacher' ? 'teachers' : 'students'
    try {
      await fetch(`/api/users/${u._id}?collection=${collection}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm),
      })
      toast.success('User updated')
      setEditingKey(null)
      load()
    } catch {
      toast.error('Failed to update user')
    }
  }

  async function toggleBlock(u) {
    const collection = u.role === 'teacher' ? 'teachers' : 'students'
    const action = u.status === 'blocked' ? 'unblock' : 'block'
    await fetch('/api/users/block', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId: u._id, collection, action }),
    })
    toast.success(`User ${action}ed`)
    load()
  }

  async function softDelete(u) {
    if (!window.confirm(`Delete ${u.name}'s account? This can be reversed by an admin later.`)) return
    const collection = u.role === 'teacher' ? 'teachers' : 'students'
    await fetch(`/api/users/${u._id}?collection=${collection}`, { method: 'DELETE' })
    toast.success('Account soft-deleted')
    load()
  }

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading users..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="users"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />
      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="User Management"
        />
        <div className="p-4 space-y-4">
          <div className="dashboard-panel flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input className="dashboard-select pl-9" placeholder="Search name, email, PRN..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
            <select className="dashboard-select !w-auto" value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
              <option value="">All roles</option>
              <option value="teacher">Teachers</option>
              <option value="student">Students</option>
            </select>
            <select className="dashboard-select !w-auto" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="active">Active</option>
              <option value="blocked">Blocked</option>
              <option value="deleted">Deleted</option>
              <option value="">All statuses</option>
            </select>
          </div>

          {loading ? (
            <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading users...</p></div>
          ) : filtered.length === 0 ? (
            <div className="dashboard-empty-state"><p className="dashboard-empty-text">No users match your filters.</p></div>
          ) : (
            <div className="dashboard-panel dashboard-panel-scroll">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-gray-500 border-b border-gray-100">
                    <th className="pb-2 pr-3">Name</th>
                    <th className="pb-2 pr-3">Role</th>
                    <th className="pb-2 pr-3">Email</th>
                    <th className="pb-2 pr-3">Department</th>
                    <th className="pb-2 pr-3">Status</th>
                    <th className="pb-2 pr-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(u => {
                    const key = `${u.role}:${u._id}`
                    const isEditing = editingKey === key
                    return (
                      <tr key={key} className="border-b border-gray-50 last:border-0">
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <input className="dashboard-select !py-1" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} />
                          ) : u.name}
                        </td>
                        <td className="py-2 pr-3"><RoleBadge role={u.role} /></td>
                        <td className="py-2 pr-3 text-gray-500">{u.email}</td>
                        <td className="py-2 pr-3">
                          {isEditing ? (
                            <input className="dashboard-select !py-1" value={editForm.department} onChange={e => setEditForm(f => ({ ...f, department: e.target.value }))} />
                          ) : u.department}
                        </td>
                        <td className="py-2 pr-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                            u.status === 'active' ? 'bg-green-100 text-green-700' : u.status === 'blocked' ? 'bg-amber-100 text-amber-700' : 'bg-gray-200 text-gray-600'
                          }`}>
                            {u.status}
                          </span>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="flex justify-end gap-1">
                            {isEditing ? (
                              <>
                                <button onClick={() => saveEdit(u)} className="p-1.5 text-primary hover:bg-primary/10 rounded"><Save size={14} /></button>
                                <button onClick={() => setEditingKey(null)} className="p-1.5 text-gray-400 hover:bg-gray-100 rounded"><X size={14} /></button>
                              </>
                            ) : (
                              <>
                                <button onClick={() => startEdit(u)} className="p-1.5 text-gray-500 hover:text-primary hover:bg-primary/10 rounded"><Pencil size={14} /></button>
                                {u.status !== 'deleted' && (
                                  <button onClick={() => toggleBlock(u)} className="p-1.5 text-gray-500 hover:text-amber-600 hover:bg-amber-50 rounded">
                                    {u.status === 'blocked' ? <CheckCircle size={14} /> : <Ban size={14} />}
                                  </button>
                                )}
                                {u.status !== 'deleted' && (
                                  <button onClick={() => softDelete(u)} className="p-1.5 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded"><Trash2 size={14} /></button>
                                )}
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
