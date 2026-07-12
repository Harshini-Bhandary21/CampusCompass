'use client'

import Link from 'next/link'
import { motion } from 'framer-motion'
import { ArrowRight } from 'lucide-react'

export default function CTASection() {
  return (
    <section className="py-16 sm:py-20">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-[2.5rem] px-8 py-14 sm:px-16 sm:py-16 text-center bg-gradient-to-br from-[#0f172a] via-[#134e4a] to-[#0f2a4a]"
        >
          <div className="absolute inset-0 bg-dot-grid-dark opacity-70 [mask-image:radial-gradient(ellipse_70%_70%_at_50%_50%,black,transparent)] pointer-events-none" />
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-teal-500/20 blur-3xl pointer-events-none animate-float" />
          <div className="absolute -bottom-24 -left-24 w-80 h-80 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none animate-float-delayed" />

          <div className="relative max-w-2xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-white tracking-tight">
              Ready to simplify your department's timetable?
            </h2>
            <p className="mt-3 text-teal-100/90 text-sm sm:text-base leading-relaxed">
              Sign in to generate, review, and publish a conflict-free schedule in minutes.
            </p>
            <div className="mt-7 flex justify-center">
              <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/auth/signin"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-[#0f172a] bg-white shadow-xl hover:shadow-2xl transition-shadow duration-300"
                >
                  Sign In
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  )
}
