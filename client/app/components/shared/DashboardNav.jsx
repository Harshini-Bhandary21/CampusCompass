'use client'

import { useSession } from 'next-auth/react'
import { Bars3Icon, Cog6ToothIcon, ChevronDownIcon } from '@heroicons/react/24/outline'
import NotificationBell from '../hub/NotificationBell'

export default function DashboardNav({ onMenuClick, title, subtitle }) {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="topbar-bg border-b topbar-border sticky top-0 z-40 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Left: Mobile Menu + Title */}
          <div className="flex items-center space-x-4">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2.5 text-white/90 hover:bg-white/20 rounded-xl transition-all duration-200 border border-white/20"
            >
              <Bars3Icon className="h-6 w-6" />
            </button>
            <div className="hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="h-10 w-1 bg-white/40 rounded-full"></div>
                <div>
                  <h1 className="text-2xl font-bold text-white">{title}</h1>
                  {subtitle && (
                    <div className="flex items-center space-x-2">
                      <div className="relative">
                        <div className="h-1.5 w-1.5 bg-green-300 rounded-full animate-ping absolute"></div>
                        <div className="h-1.5 w-1.5 bg-green-300 rounded-full"></div>
                      </div>
                      <p className="text-xs text-white/80 font-medium">{subtitle}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Right: Settings, Notifications & User */}
          <div className="flex items-center space-x-2">

            {/* Settings Button */}
            <button className="p-2.5 text-white/90 hover:bg-white/20 rounded-xl transition-all duration-200 border border-transparent hover:border-white/30 group">
              <Cog6ToothIcon className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            </button>

            {/* Notifications */}
            <NotificationBell />

            {/* User Profile */}
            <div className="flex items-center space-x-3 bg-white/10 backdrop-blur-sm border border-white/20 px-4 py-2 rounded-xl hover:bg-white/20 transition-all duration-200 cursor-pointer group">
              <div className="text-right hidden sm:block">
                <div className="text-sm font-semibold text-white truncate max-w-[150px]">
                  {session.user.name || session.user.email?.split('@')[0]}
                </div>
                <div className="text-xs text-white/80 capitalize flex items-center">
                  <span className="relative inline-flex h-1.5 w-1.5 mr-1.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-300 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-300"></span>
                  </span>
                  {session.user.role}
                </div>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-white rounded-xl blur opacity-30 group-hover:opacity-50 transition-opacity"></div>
                <div className="relative h-11 w-11 bg-white rounded-xl flex items-center justify-center shadow-lg ring-2 ring-white/30">
                  <span className="text-sm font-bold text-primary">
                    {(session.user.name || session.user.email)?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <ChevronDownIcon className="h-4 w-4 text-white/70 group-hover:text-white transition-colors" />
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
