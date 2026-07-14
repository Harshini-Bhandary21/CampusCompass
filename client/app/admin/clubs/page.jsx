'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
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
      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="Clubs"
        />
        <div className="p-4">
          <ClubsPanel role="admin" />
        </div>
      </div>
    </div>
  )
}
