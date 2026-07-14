'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { Star } from 'lucide-react'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import IconBadge from '@/app/components/dashboard/IconBadge'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import ClubsPanel from '@/app/components/hub/ClubsPanel'

export default function AdminClubsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading clubs..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="clubs"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />
      <div className="flex-1 lg:ml-0 min-w-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="Clubs"
        />
        <div className="p-4 space-y-4">
          <div className="dashboard-panel flex items-center gap-3">
            <IconBadge icon={Star} />
            <div>
              <h2 className="text-lg font-bold dark-text">Clubs</h2>
              <p className="dashboard-empty-text text-sm">Create clubs and assign coordinators and student leads</p>
            </div>
          </div>

          <ClubsPanel role="admin" />
        </div>
      </div>
    </div>
  )
}
