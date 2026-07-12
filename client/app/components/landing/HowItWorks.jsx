'use client'

import { motion } from 'framer-motion'
import { FileSpreadsheet, Cpu, ClipboardCheck, Users } from 'lucide-react'

const STEPS = [
  {
    icon: FileSpreadsheet,
    title: 'Upload',
    description: 'The department coordinator uploads a single workbook with faculty, rooms, and course-load details.',
  },
  {
    icon: Cpu,
    title: 'Solve',
    description: 'The CP-SAT constraint engine searches for a conflict-free arrangement across every rule at once.',
  },
  {
    icon: ClipboardCheck,
    title: 'Review & publish',
    description: 'The coordinator reviews the generated schedule, adjusts if needed, and publishes it.',
  },
  {
    icon: Users,
    title: 'Everyone sees it live',
    description: 'Faculty and students instantly get their own view of the published timetable — no re-sharing needed.',
  },
]

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-16 sm:py-20 bg-slate-50/60 border-y border-slate-100 overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid opacity-40 [mask-image:radial-gradient(ellipse_80%_60%_at_50%_40%,black,transparent)] pointer-events-none" />
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="eyebrow-badge mx-auto">How it works</div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            From spreadsheet to published schedule
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Four steps, no back-and-forth.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-4 relative">
          <motion.div
            initial={{ scaleX: 0 }}
            whileInView={{ scaleX: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
            className="hidden lg:block absolute top-6 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-teal-300 via-emerald-300 to-teal-300 origin-left -z-10"
          />

          {STEPS.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className="relative flex flex-col items-center text-center lg:items-start lg:text-left"
            >
              <div className="flex items-center gap-3 lg:flex-col lg:items-start">
                <motion.div
                  whileHover={{ scale: 1.1, rotate: -6 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                  className="w-12 h-12 rounded-2xl bg-white border border-slate-200 shadow-sm flex items-center justify-center text-teal-600 flex-shrink-0"
                >
                  <step.icon className="w-5 h-5" />
                </motion.div>
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400 lg:mt-3">
                  Step {index + 1}
                </span>
              </div>
              <h3 className="mt-3 text-base font-bold text-slate-900">{step.title}</h3>
              <p className="mt-1.5 text-sm text-slate-600 leading-relaxed">{step.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
