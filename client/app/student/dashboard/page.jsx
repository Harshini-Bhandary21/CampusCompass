'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Megaphone, Users, GraduationCap, Star, User, Search, ArrowRight } from 'lucide-react'
import Sidebar from '@/app/components/shared/Sidebar'
import DashboardNav from '@/app/components/shared/DashboardNav'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import CalendarViewer from '@/app/components/hub/CalendarViewer'
import AnnouncementsPanel from '@/app/components/hub/AnnouncementsPanel'
import GroupsPanel from '@/app/components/hub/GroupsPanel'
import ClubsPanel from '@/app/components/hub/ClubsPanel'
import ProfilePanel from '@/app/components/hub/ProfilePanel'
import { initialsAvatarDataUri } from '@/lib/avatar'

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'faculty', label: 'Faculty Directory', icon: GraduationCap },
  { id: 'clubs', label: 'Clubs', icon: Star },
  { id: 'profile', label: 'Profile', icon: User },
]

function FacultyDirectoryTab() {
  const [teachers, setTeachers] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/users?role=teacher').then(r => r.json()).then(setTeachers).finally(() => setLoading(false))
  }, [])

  const filtered = teachers.filter(t =>
    t.name?.toLowerCase().includes(search.toLowerCase()) || t.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h2 className="dashboard-panel-title flex items-center gap-2 !mb-0">
          <GraduationCap size={20} className="text-primary" /> Faculty Directory
        </h2>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="dashboard-select pl-9 !w-64"
            placeholder="Search faculty..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="dashboard-empty-state"><p className="dashboard-empty-text">Loading faculty...</p></div>
      ) : filtered.length === 0 ? (
        <div className="dashboard-empty-state"><p className="dashboard-empty-text">No faculty found.</p></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map(t => (
            <Link
              key={t._id}
              href={`/student/facultyinfo/${t._id}`}
              className="dashboard-list-item flex items-center gap-3 hover:border-primary/40 transition-colors"
            >
              <img
                src={t.profilePhoto || initialsAvatarDataUri(t.name)}
                alt={t.name}
                className="w-12 h-12 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0 flex-1">
                <h3 className="font-semibold text-gray-900 truncate">{t.name}</h3>
                <p className="text-xs text-gray-500 truncate">{t.designation}</p>
                <p className="text-xs text-gray-400 truncate">{t.department}</p>
              </div>
              <ArrowRight size={14} className="text-gray-300 shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function StudentDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('calendar')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session?.user?.role !== 'student') router.push('/')
  }, [status, session, router])

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading your dashboard..." />
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={TABS}
        portalLabel="Student Portal"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNav onMenuClick={() => setSidebarOpen(true)} title="Student Dashboard" subtitle={session.user.department} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'calendar' && <CalendarViewer />}
          {activeTab === 'announcements' && <AnnouncementsPanel role="student" />}
          {activeTab === 'groups' && <GroupsPanel role="student" />}
          {activeTab === 'faculty' && <FacultyDirectoryTab />}
          {activeTab === 'clubs' && <ClubsPanel role="student" />}
          {activeTab === 'profile' && <ProfilePanel role="student" />}
        </main>
      </div>
    </div>
  )
}
