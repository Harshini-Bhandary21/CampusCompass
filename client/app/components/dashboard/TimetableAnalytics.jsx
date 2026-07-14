'use client'

import { useState } from 'react'
import { ChartBarIcon, AcademicCapIcon, BuildingOfficeIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function TimetableAnalytics({ analytics, onEditExcel }) {
  const [activeTab, setActiveTab] = useState('overview')

  if (!analytics) return null

  const { faculty, batches, rooms, totalClasses } = analytics
  const theoryCount = batches?.filter(b => b.type === 'Theory').length || 0
  const labCount = batches?.filter(b => b.type === 'Lab').length || 0
  const maxHours = Math.max(...(faculty?.map(f => parseFloat(f.hours)) || [0]))
  const theoryRooms = rooms?.filter(r => r.type === 'Theory').length || 0
  const labRooms = rooms?.filter(r => r.type === 'Lab').length || 0

  const facultyByHours = [...(faculty || [])].sort((a, b) => parseFloat(b.hours) - parseFloat(a.hours))
  const avgFacultyHours = faculty?.length ? (faculty.reduce((sum, f) => sum + parseFloat(f.hours), 0) / faculty.length).toFixed(1) : 0

  return (
    <div className="content-card rounded-xl border dashboard-border p-5 space-y-5 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="page-title">
          Input Data Analytics
        </h2>
        <div className="flex items-center space-x-3">
          <button
            onClick={onEditExcel}
            className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-all shadow-md hover:shadow-lg"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            <span className="font-semibold">Edit Excel Virtually</span>
          </button>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
            <span className="text-sm text-gray-600">Live Data</span>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="flex space-x-2 border-b border-gray-300">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ChartBarIcon className="h-5 w-5 inline mr-2" />
          Overview
        </button>
        <button
          onClick={() => setActiveTab('faculty')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'faculty'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <UserGroupIcon className="h-5 w-5 inline mr-2" />
          Faculty
        </button>
        <button
          onClick={() => setActiveTab('batches')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'batches'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <AcademicCapIcon className="h-5 w-5 inline mr-2" />
          Batches
        </button>
        <button
          onClick={() => setActiveTab('rooms')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'rooms'
              ? 'border-b-2 border-primary text-primary'
              : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <BuildingOfficeIcon className="h-5 w-5 inline mr-2" />
          Rooms
        </button>
      </div>

      {activeTab === 'overview' && (
      <>
      <div className="grid grid-cols-4 gap-3">
        <div className="bg-primary rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform relative overflow-hidden">
          <svg className="absolute top-2 right-2 w-10 h-10 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
          </svg>
          <div className="text-3xl font-bold">{faculty?.length || 0}</div>
          <p className="text-sm opacity-90 mt-1">Faculty Members</p>
        </div>
        <div className="bg-primary rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform relative overflow-hidden">
          <svg className="absolute top-2 right-2 w-10 h-10 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          <div className="text-3xl font-bold">{batches?.length || 0}</div>
          <p className="text-sm opacity-90 mt-1">Total Batches</p>
        </div>
        <div className="bg-primary rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform relative overflow-hidden">
          <svg className="absolute top-2 right-2 w-10 h-10 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-2a1 1 0 00-1-1H9a1 1 0 00-1 1v2a1 1 0 01-1 1H4a1 1 0 110-2V4zm3 1h2v2H7V5zm2 4H7v2h2V9zm2-4h2v2h-2V5zm2 4h-2v2h2V9z" clipRule="evenodd" />
          </svg>
          <div className="text-3xl font-bold">{rooms?.length || 0}</div>
          <p className="text-sm opacity-90 mt-1">Available Rooms</p>
        </div>
        <div className="bg-primary rounded-xl p-4 text-white shadow-lg transform hover:scale-105 transition-transform relative overflow-hidden">
          <svg className="absolute top-2 right-2 w-10 h-10 opacity-20" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
          </svg>
          <div className="text-3xl font-bold">{totalClasses || 0}</div>
          <p className="text-sm opacity-90 mt-1">Total Classes</p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="content-card rounded-xl shadow-md p-4 border dashboard-border">
          <h3 className="section-title mb-4 flex items-center">
            <div className="w-1 h-5 bg-primary rounded mr-2"></div>
            Faculty Workload Distribution
          </h3>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-2">
            {faculty?.slice(0, 10).map((f, idx) => (
              <div key={idx} className="group">
                <div className="flex justify-between text-sm mb-1.5">
                  <span className="text-gray-900 font-medium truncate">{f.name}</span>
                  <span className="text-primary font-bold">{f.hours}h</span>
                </div>
                <div className="relative w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                  <div
                    className="absolute h-2.5 rounded-full bg-primary transition-all duration-500"
                    style={{ width: `${(parseFloat(f.hours) / maxHours * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="content-card rounded-xl shadow-md p-4 border dashboard-border">
          <h3 className="section-title mb-4 flex items-center">
            <div className="w-1 h-5 bg-primary rounded mr-2"></div>
            Class Type Distribution
          </h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-40 h-40">
              <svg viewBox="0 0 100 100" className="transform -rotate-90">
                <circle cx="50" cy="50" r="40" fill="none" stroke="var(--content-border)" strokeWidth="20"/>
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="var(--primary)"
                  strokeWidth="20"
                  strokeDasharray={`${(theoryCount / (theoryCount + labCount || 1)) * 251.2} 251.2`}
                  className="transition-all duration-500"
                />
                <circle
                  cx="50" cy="50" r="40"
                  fill="none"
                  stroke="var(--chart-3)"
                  strokeWidth="20"
                  strokeDasharray={`${(labCount / (theoryCount + labCount || 1)) * 251.2} 251.2`}
                  strokeDashoffset={`-${(theoryCount / (theoryCount + labCount || 1)) * 251.2}`}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{theoryCount + labCount}</div>
                  <div className="text-sm text-gray-600">Classes</div>
                </div>
              </div>
            </div>
            <div className="ml-6 space-y-3">
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded bg-primary"></div>
                <div>
                  <div className="text-sm text-gray-600">Theory</div>
                  <div className="text-xl font-bold text-gray-900">{theoryCount}</div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 rounded chart-color-3"></div>
                <div>
                  <div className="text-sm text-gray-600">Lab</div>
                  <div className="text-xl font-bold text-gray-900">{labCount}</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="content-card rounded-xl shadow-md p-4 border dashboard-border">
          <h3 className="section-title mb-4 flex items-center">
            <div className="w-1 h-5 bg-primary rounded mr-2"></div>
            Room Allocation
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Theory Rooms</span>
                <span className="text-base font-bold text-primary">{theoryRooms}</span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                <div
                  className="absolute h-3.5 rounded-full bg-primary"
                  style={{ width: `${(theoryRooms / rooms?.length * 100)}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Lab Rooms</span>
                <span className="text-base font-bold text-[var(--chart-3)]">{labRooms}</span>
              </div>
              <div className="relative w-full bg-gray-200 rounded-full h-3.5 overflow-hidden">
                <div
                  className="absolute h-3.5 rounded-full chart-color-3"
                  style={{ width: `${(labRooms / rooms?.length * 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="content-card rounded-xl shadow-md p-4 border dashboard-border">
          <h3 className="section-title mb-4 flex items-center">
            <div className="w-1 h-5 bg-primary rounded mr-2"></div>
            Batch Overview
          </h3>
          <div className="grid grid-cols-2 gap-2 max-h-56 overflow-y-auto">
            {batches?.slice(0, 12).map((batch, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg border-2 ${
                  batch.type === 'Lab'
                    ? 'bg-amber-50 border-amber-300'
                    : 'bg-primary/10 border-primary/30'
                }`}
              >
                <div className="text-sm font-bold text-gray-900 truncate">{batch.name}</div>
                <div className={`text-xs font-semibold mt-1 ${
                  batch.type === 'Lab' ? 'text-[var(--chart-3)]' : 'text-primary'
                }`}>
                  {batch.type}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      </>
      )}

      {activeTab === 'faculty' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{faculty?.length || 0}</div>
              <p className="text-sm opacity-90">Total Faculty</p>
            </div>
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{avgFacultyHours}</div>
              <p className="text-sm opacity-90">Avg Hours/Faculty</p>
            </div>
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{maxHours}</div>
              <p className="text-sm opacity-90">Max Hours</p>
            </div>
          </div>
          <div className="content-card rounded-xl p-4 border dashboard-border">
            <h3 className="section-title mb-4">Faculty Workload Ranking</h3>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {facultyByHours.map((f, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm">
                    {idx + 1}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between mb-1">
                      <span className="text-gray-900 font-medium">{f.name}</span>
                      <span className="text-primary font-bold">{f.hours}h</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-primary"
                        style={{ width: `${(parseFloat(f.hours) / maxHours * 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'batches' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{batches?.length || 0}</div>
              <p className="text-sm opacity-90">Total Batches</p>
            </div>
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{theoryCount}</div>
              <p className="text-sm opacity-90">Theory Batches</p>
            </div>
            <div className="chart-color-3 rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{labCount}</div>
              <p className="text-sm opacity-90">Lab Batches</p>
            </div>
          </div>
          <div className="content-card rounded-xl p-4 border dashboard-border">
            <h3 className="section-title mb-4">All Batches</h3>
            <div className="grid grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {batches?.map((batch, idx) => (
                <div
                  key={idx}
                  className={`p-3 rounded-lg border-2 ${
                    batch.type === 'Lab'
                      ? 'bg-amber-50 border-amber-300'
                      : 'bg-primary/10 border-primary/30'
                  }`}
                >
                  <div className="text-sm font-bold text-gray-900 truncate">{batch.name}</div>
                  <div className={`text-xs font-semibold mt-1 ${
                    batch.type === 'Lab' ? 'text-[var(--chart-3)]' : 'text-primary'
                  }`}>
                    {batch.type}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rooms' && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{rooms?.length || 0}</div>
              <p className="text-sm opacity-90">Total Rooms</p>
            </div>
            <div className="bg-primary rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{theoryRooms}</div>
              <p className="text-sm opacity-90">Theory Rooms</p>
            </div>
            <div className="chart-color-3 rounded-xl p-4 text-white">
              <div className="text-3xl font-bold">{labRooms}</div>
              <p className="text-sm opacity-90">Lab Rooms</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="content-card rounded-xl p-4 border dashboard-border">
              <h3 className="section-title mb-4">Theory Rooms</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rooms?.filter(r => r.type === 'Theory').map((room, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-primary/10 border border-primary/30 rounded-lg">
                    <span className="text-gray-900 font-medium">{room.name}</span>
                    <span className="px-2 py-1 bg-primary text-white rounded text-xs font-bold">Theory</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="content-card rounded-xl p-4 border dashboard-border">
              <h3 className="section-title mb-4">Lab Rooms</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {rooms?.filter(r => r.type === 'Lab').map((room, idx) => (
                  <div key={idx} className="flex items-center justify-between p-2 bg-amber-50 border border-amber-300 rounded-lg">
                    <span className="text-gray-900 font-medium">{room.name}</span>
                    <span className="px-2 py-1 chart-color-3 text-white rounded text-xs font-bold">Lab</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
