'use client'

import { motion } from 'framer-motion'
import videos from '../../data/videos.json'

export default function WatchDemo() {
  return (
    <section id="demo" className="py-16 sm:py-20 bg-slate-50/60 border-y border-slate-100">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <div className="eyebrow-badge mx-auto">Demo</div>
          <h2 className="mt-4 text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
            See it in action
          </h2>
          <p className="mt-3 text-slate-600 text-sm sm:text-base leading-relaxed">
            Walkthroughs of the platforms your schedule connects to.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {videos.map((video, index) => (
            <motion.div
              key={video.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.08 }}
              className="rounded-3xl overflow-hidden border border-slate-200 bg-white shadow-sm hover:shadow-xl transition-shadow duration-300"
            >
              <div className="bg-black">
                <video controls className="w-full" preload="metadata">
                  <source src={video.file} type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
              <div className="p-5 text-center">
                <h3 className="text-base font-semibold text-slate-900">{video.title}</h3>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
