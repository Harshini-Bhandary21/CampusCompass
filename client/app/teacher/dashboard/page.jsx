'use client'

import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CalendarDays, Megaphone, Users, Star, User } from 'lucide-react'
import Sidebar from '@/app/components/shared/Sidebar'
import DashboardNav from '@/app/components/shared/DashboardNav'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import CalendarViewer from '@/app/components/hub/CalendarViewer'
import AnnouncementsPanel from '@/app/components/hub/AnnouncementsPanel'
import GroupsPanel from '@/app/components/hub/GroupsPanel'
import ClubsPanel from '@/app/components/hub/ClubsPanel'
import ProfilePanel from '@/app/components/hub/ProfilePanel'

const TABS = [
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'announcements', label: 'Announcements', icon: Megaphone },
  { id: 'groups', label: 'Groups', icon: Users },
  { id: 'clubs', label: 'Clubs', icon: Star },
  { id: 'profile', label: 'Profile', icon: User },
]

export default function TeacherDashboard() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('announcements')
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session?.user?.role !== 'teacher') router.push('/')
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
        portalLabel="Teacher Portal"
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        <DashboardNav onMenuClick={() => setSidebarOpen(true)} title="Teacher Dashboard" subtitle={session.user.department} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'calendar' && <CalendarViewer />}
          {activeTab === 'announcements' && <AnnouncementsPanel role="teacher" />}
          {activeTab === 'groups' && <GroupsPanel role="teacher" />}
          {activeTab === 'clubs' && <ClubsPanel role="teacher" />}
          {activeTab === 'profile' && <ProfilePanel role="teacher" />}
        </main>
      </div>
    </div>
  )
}
