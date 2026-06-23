'use client'

import Link from 'next/link'
import {
  UserGroupIcon,
  CalendarDaysIcon,
  PhotoIcon,
  UsersIcon,
  AcademicCapIcon,
  BuildingOffice2Icon,
} from '@heroicons/react/24/outline'

const items = [
  {
    href: '/clubs',
    label: 'Clubs',
    description: 'Explore student-led communities',
    icon: UserGroupIcon,
    gradient: 'from-purple-500 to-purple-700',
  },
  {
    href: '/events',
    label: 'Events',
    description: 'Hackathons, fests & meets',
    icon: CalendarDaysIcon,
    gradient: 'from-cyan-500 to-cyan-700',
  },
  {
    href: '/gallery',
    label: 'Gallery',
    description: 'Moments from campus life',
    icon: PhotoIcon,
    gradient: 'from-pink-500 to-pink-700',
  },
  // {
  //   href: '/team',
  //   label: 'Team',
  //   description: 'Meet our coordinators',
  //   icon: UsersIcon,
  //   gradient: 'from-teal-500 to-teal-700',
  // },
  {
    href: '/student/dashboard',
    label: 'Student',
    description: 'Your dashboard & timetable',
    icon: AcademicCapIcon,
    gradient: 'from-blue-500 to-blue-700',
  },
  {
  href: 'https://xyz-wheat-sigma.vercel.app/',
  label: '3D Campus',
  description: 'Explore campus in 3D',
  icon: BuildingOffice2Icon,
  gradient: 'from-orange-500 to-orange-700',
},
]

export default function ExploreSection() {
  return (
    <section className="py-16 bg-white/60 backdrop-blur-sm border-t border-teal-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-teal-800 mb-3">
            Explore Campus Life
          </h2>
          <p className="text-gray-600 text-base">
            Discover clubs, events, and the people behind CampusCompass.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group bg-white rounded-2xl border border-teal-200 p-6 text-center shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <div className={`mx-auto mb-4 w-14 h-14 rounded-xl bg-gradient-to-br ${item.gradient} flex items-center justify-center group-hover:scale-110 transition-transform`}>
                  <Icon className="h-7 w-7 text-white" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-1">
                  {item.label}
                </h3>
                <p className="text-sm text-gray-500">
                  {item.description}
                </p>
              </Link>
            )
          })}
        </div>

      </div>
    </section>
  )
}