'use client'

import { useScrollAnimationMultiple } from '../lib/useScrollAnimation'
import HeroSection from './components/landing/HeroSection'
import ExploreSection from './components/landing/ExploreSection'
import WatchDemo from './components/WatchDemo'
import FAQSection from './components/FAQSection'

export default function Home() {
  useScrollAnimationMultiple(0.1)

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <HeroSection />

      <ExploreSection />

      <div id="watch-demo">
        <WatchDemo />
      </div>

      <FAQSection />
    </div>
  )
}
