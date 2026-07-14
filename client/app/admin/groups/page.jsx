'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import GroupsPanel from '@/app/components/hub/GroupsPanel'

export default function AdminGroupsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') router.push('/auth/signin')
    else if (status === 'authenticated' && session.user.role !== 'admin') router.push('/')
  }, [status, session, router])

  if (status === 'loading' || !session) {
    return <LoadingSpinner message="Loading groups..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="groups"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />
      <div className="flex-1 lg:ml-0">
        <DashboardNav
          onMenuClick={() => setSidebarOpen(!sidebarOpen)}
          title="First Year Department"
          subtitle="Groups"
        />
        <div className="p-4">
          <GroupsPanel role="admin" />
        </div>
      </div>
    </div>
  )
}
