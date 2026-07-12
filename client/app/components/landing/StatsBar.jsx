'use client'

import { motion } from 'framer-motion'
import AnimatedCounter from './AnimatedCounter'

const STATS = [
  { value: '100%', label: 'Conflict-free by construction' },
  { value: '7', label: 'Department modules in one workspace' },
  { value: '3', label: 'User roles — coordinator, faculty, student' },
  { value: 'NEP 2020', label: 'Credit-based framework alignment' },
]

export default function StatsBar() {
  return (
    <section className="relative py-12 border-y border-slate-100 bg-white overflow-hidden">
      <div className="absolute inset-0 bg-dot-grid opacity-30 [mask-image:radial-gradient(ellipse_80%_100%_at_50%_50%,black,transparent)] pointer-events-none" />
      <div className="relative max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-6 lg:divide-x lg:divide-slate-100">
          {STATS.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="text-center lg:text-left lg:pl-6 lg:first:pl-0"
            >
              <div className="text-2xl sm:text-3xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                <AnimatedCounter value={stat.value} />
              </div>
              <p className="mt-1.5 text-xs sm:text-sm text-slate-600 leading-snug">{stat.label}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
