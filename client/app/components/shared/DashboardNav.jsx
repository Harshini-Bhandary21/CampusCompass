'use client'

import { useSession } from 'next-auth/react'
import { Bars3Icon } from '@heroicons/react/24/outline'

export default function DashboardNav({ onMenuClick, title, subtitle }) {
  const { data: session } = useSession()

  if (!session) return null

  return (
    <nav className="topbar-bg border-b topbar-border sticky top-0 z-40 shadow-lg">
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left: Mobile Menu + Title */}
          <div className="flex items-center space-x-3">
            <button
              onClick={onMenuClick}
              className="lg:hidden p-2 text-white/90 hover:bg-white/20 rounded-lg transition-all duration-200 border border-white/20"
            >
              <Bars3Icon className="h-5 w-5" />
            </button>
            <div className="hidden lg:block">
              <div className="flex items-center space-x-3">
                <div className="h-7 w-1 bg-white/40 rounded-full"></div>
                <div>
                  <h1 className="text-lg font-semibold text-white leading-tight">{title}</h1>
                  {subtitle && (
                    <div className="flex items-center space-x-1.5">
                      <div className="relative">
                        <div className="h-1 w-1 bg-green-300 rounded-full animate-ping absolute"></div>
                        <div className="h-1 w-1 bg-green-300 rounded-full"></div>
                      </div>
                      <p className="text-xs text-white/80 font-medium leading-tight">{subtitle}</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </nav>
  )
}
