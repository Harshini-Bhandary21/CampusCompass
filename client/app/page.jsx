'use client'

import { useScrollAnimationMultiple } from '../lib/useScrollAnimation'
import Header from './components/landing/Header'
import HeroSection from './components/landing/HeroSection'
import ExploreSection from './components/landing/ExploreSection'
import WatchDemo from './components/WatchDemo'
import FAQSection from './components/FAQSection'
import Footer from './components/landing/Footer'
import ParallaxSection from './components/landing/ParallaxSection'

export default function Home() {
  useScrollAnimationMultiple(0.1)

  return (
<div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
   <Header />
  <HeroSection />

  <ExploreSection />

  <div id="watch-demo">
    <WatchDemo />
  </div>

  <FAQSection />

  

  <ParallaxSection />

  

  <Footer />

</div>
  )
}