'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import DashboardNav from '@/app/components/shared/DashboardNav'
import Sidebar from '@/app/components/shared/Sidebar'
import LoadingSpinner from '@/app/components/shared/LoadingSpinner'
import { BellIcon } from '@heroicons/react/24/outline'
import { getDepartmentTabs, createTabNavigator } from '@/app/components/dashboard/DepartmentSidebarConfig'

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
      console.error('Error fetching department data:', error)
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
      console.error('Error fetching notifications:', error)
    }
  }



  if (loading || status === 'loading') {
    return <LoadingSpinner message="Loading notifications..." />
  }

  return (
    <div className="min-h-screen content-bg flex">
      <Sidebar
        activeTab="notify"
        setActiveTab={createTabNavigator(router)}
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        tabs={getDepartmentTabs()}
      />

      <div className="flex-1 lg:ml-0">
        <DashboardNav 
          onMenuClick={() => setSidebarOpen(!sidebarOpen)} 
          title={`${department?.name || departmentName} Department`}
          subtitle="Notifications"
        />
        <div className="p-4">
          <div className="bg-white rounded-xl border border-secondary p-4 mb-4">
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <BellIcon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-gray-800">Notifications</h2>
                <p className="text-sm text-gray-600">View notifications from admin</p>
              </div>
            </div>
          </div>

          {notifications.length === 0 ? (
            <div className="bg-white rounded-xl border border-secondary p-8 text-center">
              <BellIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-gray-800 mb-2">No Notifications</h3>
              <p className="text-gray-600">You don't have any notifications yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((notification, index) => (
                <div key={index} className="bg-white rounded-xl border border-secondary p-4 hover:border-primary/40 transition-all">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-bold text-gray-800">{notification.title}</h3>
                    <span className="text-xs text-gray-500">
                      {new Date(notification.sentAt).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">{notification.body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
