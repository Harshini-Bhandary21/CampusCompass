import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import facultyData from '@/data/faculty.json'
import FacultyCard from './FacultyCard'

export default function FacultyShowcase() {
  const preview = facultyData.slice(0, 3)

  return (
    <section id="faculty" className="py-16 sm:py-20">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-6 mb-12">
          <div className="max-w-xl">
            <div className="eyebrow-badge">Faculty</div>
            <h2 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              Meet the department
            </h2>
            <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
              The faculty directory every generated timetable is built around.
            </p>
          </div>
          <Link
            href="/student/facultyinfo"
            className="btn-secondary self-start sm:self-auto whitespace-nowrap"
          >
            View Full Directory
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {preview.map((faculty, index) => (
            <FacultyCard key={faculty.id} faculty={faculty} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
