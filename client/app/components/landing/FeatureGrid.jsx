'use client'

import { motion } from 'framer-motion'
import { UploadCloud, Cpu, LayoutDashboard, ShieldCheck, FileDown, BookOpenCheck } from 'lucide-react'

const FEATURES = [
  {
    icon: Cpu,
    title: 'Constraint-based solving',
    description:
      "Built on Google OR-Tools CP-SAT — every generated timetable respects faculty availability, room capacity, and course load simultaneously, not one rule at a time.",
    featured: true,
  },
  {
    icon: UploadCloud,
    title: 'Spreadsheet in, timetable out',
    description: 'Upload the department’s faculty, room, and course workbook — no manual setup screens to fill in.',
  },
  {
    icon: LayoutDashboard,
    title: 'Three views, one schedule',
    description: 'Browse the same generated timetable by faculty, by room, or by division — always in sync with each other.',
  },
  {
    icon: ShieldCheck,
    title: 'Role-based access',
    description: 'Coordinators generate and publish schedules; faculty and students get a live, read-only view of their own.',
  },
  {
    icon: BookOpenCheck,
    title: 'NEP 2020 aligned',
    description: "Structured around India's credit-based, multidisciplinary curriculum framework from the ground up.",
  },
  {
    icon: FileDown,
    title: 'Export anywhere',
    description: 'Download the finalized timetable as an Excel workbook, ready to print, share, or archive.',
  },
]

export default function FeatureGrid() {
  return (
    <section id="features" className="relative py-16 sm:py-20 overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid opacity-60 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_20%,black,transparent)] pointer-events-none" />
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="eyebrow-badge mx-auto">Features</div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            Everything a department needs to schedule with confidence
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            No spreadsheets, no manual cross-checking — just an optimized timetable your whole
            department can trust.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.06 }}
              className={`group relative rounded-3xl p-7 border border-slate-200 bg-white shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 ${
                feature.featured ? 'lg:col-span-2 bg-gradient-to-br from-slate-50 to-white' : ''
              }`}
            >
              <motion.div
                whileHover={{ scale: 1.12, rotate: 8 }}
                transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                className="w-11 h-11 rounded-2xl bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center shadow-lg shadow-teal-500/20"
              >
                <feature.icon className="w-5 h-5 text-white" />
              </motion.div>
              <h3 className="mt-5 text-base font-bold text-slate-900">{feature.title}</h3>
              <p className="mt-2 text-sm text-slate-600 leading-relaxed">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
