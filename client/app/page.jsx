'use client'

import { useScrollAnimationMultiple } from '../lib/useScrollAnimation'
import HeroSection from './components/landing/HeroSection'
import WatchDemo from './components/WatchDemo'

export default function Home() {
  useScrollAnimationMultiple(0.1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <HeroSection />

      <div id="watch-demo">
        <WatchDemo />
      </div>
    </div>
  )
}
