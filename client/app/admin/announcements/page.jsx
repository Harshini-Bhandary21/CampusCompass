'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Megaphone } from 'lucide-react'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import IconBadge from '@/app/components/dashboard/IconBadge'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import AnnouncementsPanel from '@/app/components/hub/AnnouncementsPanel'

export default function AdminAnnouncementsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading announcements..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="announcements"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />
      <div className="flex-1 lg:ml-0 min-w-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="Announcements"
        />
        <div className="p-4 space-y-4">
          <div className="dashboard-panel flex items-center gap-3">
            <IconBadge icon={Megaphone} />
            <div>
              <h2 className="text-lg font-bold dark-text">Announcements</h2>
              <p className="dashboard-empty-text text-sm">Post and manage department-wide announcements</p>
            </div>
          </div>

          <AnnouncementsPanel role="admin" />
        </div>
      </div>
    </div>
  )
}
