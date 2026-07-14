'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import CurrentScheduleView from '@/app/components/dashboard/CurrentScheduleView'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'

export default function SchedulesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const departmentName = "First Year"
  const [department, setDepartment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin')
    } else if (status === 'authenticated' && session.user.role !== 'admin') {
      router.push('/')
    }
  }, [status, session, router])

  useEffect(() => {
    if (session?.user.role === 'admin') {
      fetchDepartmentData()
    }
  }, [session])

  const fetchDepartmentData = async () => {
    try {
      const response = await fetch(`/api/coordinators/get-department?department=${encodeURIComponent(departmentName)}`)
      const data = await response.json()
      if (data.success) setDepartment(data.department)
    } catch (error) {
    } finally {
      setLoading(false)
    }
  }



  if (loading || status === 'loading') {
    return <LoadingSpinner message="Loading schedules..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="schedules"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          title={`${department?.name || departmentName} Department`}
          subtitle="Schedules"
        />
        <div className="p-4">
          <CurrentScheduleView department={department} departmentName={departmentName} />
        </div>
      </div>
    </div>
  )
}
