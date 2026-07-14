'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import { BellIcon } from '@heroicons/react/24/outline'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'
import IconBadge from '@/app/components/dashboard/IconBadge'

export default function NotifyPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const departmentName = "First Year"
  const [department, setDepartment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifications, setNotifications] = useState([])

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
      fetchNotifications()
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

  const fetchNotifications = async () => {
    try {
      const response = await fetch(`/api/coordinators/get-notifications?department=${encodeURIComponent(departmentName)}`)
      const data = await response.json()
      if (data.success) setNotifications(data.notifications || [])
    } catch (error) {
    }
  }



  if (loading || status === 'loading') {
    return <LoadingSpinner message="Loading notifications..." />
  }

  return (
    <div className="min-h-screen flex">
      <Sidebar
        activeTab="notify"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0 min-w-0">
        <DashboardNav 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          title={`${department?.name || departmentName} Department`}
          subtitle="Notifications"
        />
        <div className="p-4">
          <div className="dashboard-panel mb-4">
            <div className="flex items-center space-x-3">
              <IconBadge icon={BellIcon} />
              <div>
                <h2 className="text-lg font-bold dark-text">Notifications</h2>
                <p className="dashboard-empty-text text-sm">View notifications from admin</p>
              </div>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="dashboard-empty-state">
              <div className="flex justify-center mb-4">
                <IconBadge icon={BellIcon} size="lg" />
              </div>
              <h3 className="dashboard-empty-title">No Notifications</h3>
              <p className="dashboard-empty-text">You don't have any notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="dashboard-list-item hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold dark-text">{notification.title}</h3>
                    <span className="text-xs dashboard-empty-text">
                      {new Date(notification.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="dashboard-empty-text text-sm whitespace-pre-wrap">{notification.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
