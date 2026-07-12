import HeroSection from './HeroSection'
import FeatureGrid from './FeatureGrid'
import HowItWorks from './HowItWorks'
import StatsBar from './StatsBar'
import FacultyShowcase from './FacultyShowcase'
import WatchDemo from '../WatchDemo'
import CTASection from './CTASection'

export default function HomeContent() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-50 via-emerald-50 to-cyan-50">
      <HeroSection />
      <FeatureGrid />
      <HowItWorks />
      <StatsBar />
      <FacultyShowcase />
      <WatchDemo />
      <CTASection />
    </div>
  )
}
