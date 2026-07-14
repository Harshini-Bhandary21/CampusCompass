'use client'

import { useEffect, useState } from 'react'

export default function WaitingRoom() {
  const [dots, setDots] = useState('')
  const [tipIndex, setTipIndex] = useState(0)

  const tips = [
    "Optimizing class schedules for maximum efficiency...",
    "Balancing faculty workload across departments...",
    "Ensuring no time conflicts in room allocations...",
    "Analyzing course requirements and constraints...",
    "Creating the perfect timetable just for you..."
  ]

  useEffect(() => {
    const dotsInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)

    const tipInterval = setInterval(() => {
      setTipIndex(prev => (prev + 1) % tips.length)
    }, 3000)

    return () => {
      clearInterval(dotsInterval)
      clearInterval(tipInterval)
    }
  }, [])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md">
      <div className="relative w-full max-w-2xl mx-4">
        {/* Floating Background Elements - Many SVGs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Circles */}
          <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full animate-float"></div>
          <div className="absolute top-40 right-20 w-24 h-24 bg-primary/15 rounded-full animate-float-delayed"></div>
          <div className="absolute bottom-20 left-1/4 w-40 h-40 bg-primary/10 rounded-full animate-float-slow"></div>
          <div className="absolute bottom-40 right-1/3 w-20 h-20 bg-primary/20 rounded-full animate-float"></div>

          {/* Many SVG Shapes */}
          <svg className="absolute top-20 right-1/4 w-24 h-24 text-primary/30 animate-float" viewBox="0 0 100 100">
            <polygon points="50,10 90,90 10,90" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-32 left-1/3 w-28 h-28 text-primary/25 animate-float-delayed" viewBox="0 0 100 100">
            <rect x="20" y="20" width="60" height="60" rx="10" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/3 left-20 w-20 h-20 text-primary/30 animate-float-slow" viewBox="0 0 100 100">
            <polygon points="50,10 90,40 75,85 25,85 10,40" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-1/4 right-20 w-32 h-32 text-primary/20 animate-float" viewBox="0 0 100 100">
            <polygon points="50,5 90,25 90,65 50,85 10,65 10,25" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/2 right-1/3 w-16 h-16 text-primary/35 animate-float-delayed" viewBox="0 0 100 100">
            <polygon points="50,10 61,35 88,35 66,52 77,77 50,60 23,77 34,52 12,35 39,35" fill="currentColor"/>
          </svg>
          <svg className="absolute top-2/3 left-1/4 w-20 h-20 text-primary/25 animate-float-slow" viewBox="0 0 100 100">
            <circle cx="30" cy="30" r="20" fill="currentColor"/>
            <circle cx="70" cy="70" r="15" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/4 left-1/2 w-22 h-22 text-primary/30 animate-float" viewBox="0 0 100 100">
            <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-1/3 right-1/4 w-26 h-26 text-primary/20 animate-float-delayed" viewBox="0 0 100 100">
            <ellipse cx="50" cy="50" rx="40" ry="25" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/2 left-1/3 w-18 h-18 text-primary/35 animate-float-slow" viewBox="0 0 100 100">
            <rect x="25" y="25" width="50" height="50" rx="15" fill="currentColor" transform="rotate(45 50 50)"/>
          </svg>
          <svg className="absolute bottom-1/2 right-1/2 w-24 h-24 text-primary/25 animate-float" viewBox="0 0 100 100">
            <path d="M50,20 Q80,50 50,80 Q20,50 50,20" fill="currentColor"/>
          </svg>
          <svg className="absolute top-16 left-1/4 w-20 h-20 text-primary/30 animate-float-delayed" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="8"/>
          </svg>
          <svg className="absolute bottom-16 right-1/3 w-28 h-28 text-primary/20 animate-float-slow" viewBox="0 0 100 100">
            <polygon points="50,15 65,40 92,40 70,58 78,85 50,67 22,85 30,58 8,40 35,40" fill="currentColor"/>
          </svg>
        </div>

        {/* Main Card */}
        <div className="relative bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 p-12 overflow-hidden">
          {/* Animated Border Glow */}
          <div className="absolute inset-0 rounded-3xl bg-gradient-to-r from-cyan-400/20 via-teal-400/20 to-cyan-400/20 animate-pulse"></div>

          {/* Content */}
          <div className="relative z-10 text-center space-y-8">
            {/* Animated Icon */}
            <div className="flex justify-center">
              <div className="relative">
                {/* Outer Ring */}
                <div className="absolute inset-0 w-32 h-32 border-4 border-white/30 rounded-full animate-spin-slow"></div>
                {/* Middle Ring */}
                <div className="absolute inset-2 w-28 h-28 border-4 border-white/20 rounded-full animate-spin-reverse"></div>
                {/* Inner Circle with Icon */}
                <div className="relative w-32 h-32 bg-gradient-to-br from-white/20 to-white/5 rounded-full flex items-center justify-center backdrop-blur-sm">
                  <svg className="w-16 h-16 text-white animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                </div>
                {/* Orbiting Dots */}
                <div className="absolute top-0 left-1/2 w-3 h-3 bg-cyan-400 rounded-full animate-orbit"></div>
                <div className="absolute top-1/2 right-0 w-3 h-3 bg-teal-400 rounded-full animate-orbit-delayed"></div>
                <div className="absolute bottom-0 left-1/2 w-3 h-3 bg-cyan-300 rounded-full animate-orbit-slow"></div>
              </div>
            </div>

            {/* Title */}
            <div className="space-y-3">
              <h2 className="text-4xl font-bold text-white">
                Analyzing Your Inputs{dots}
              </h2>
              <p className="text-xl text-white/80 font-medium">
                Please wait while we process your data
              </p>
            </div>

            {/* Progress Bar */}
            <div className="space-y-3">
              <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 via-teal-400 to-cyan-400 rounded-full animate-progress"></div>
              </div>
              <p className="text-sm text-white/70 italic animate-fade-in-out">
                {tips[tipIndex]}
              </p>
            </div>
          </div>

          {/* Decorative Elements */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl"></div>
          <div className="absolute bottom-0 left-0 w-40 h-40 bg-gradient-to-tr from-primary/20 to-transparent rounded-full blur-3xl"></div>

          {/* Many More SVG Decorations Inside Card */}
          <svg className="absolute top-8 right-8 w-12 h-12 text-white/10 animate-spin-slow" viewBox="0 0 100 100">
            <polygon points="50,10 90,30 90,70 50,90 10,70 10,30" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-8 left-8 w-16 h-16 text-white/10 animate-float" viewBox="0 0 100 100">
            <circle cx="25" cy="25" r="15" fill="currentColor"/>
            <circle cx="75" cy="25" r="15" fill="currentColor"/>
            <circle cx="25" cy="75" r="15" fill="currentColor"/>
            <circle cx="75" cy="75" r="15" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/3 right-16 w-14 h-14 text-white/10 animate-float-delayed" viewBox="0 0 100 100">
            <path d="M50,10 L90,50 L50,90 L10,50 Z" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-1/3 left-16 w-14 h-14 text-white/10 animate-float-slow" viewBox="0 0 100 100">
            <polygon points="50,5 80,25 80,65 50,85 20,65 20,25" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/2 left-1/4 w-10 h-10 text-white/10 animate-float" viewBox="0 0 100 100">
            <rect x="20" y="20" width="60" height="60" rx="10" fill="currentColor" transform="rotate(20 50 50)"/>
          </svg>
          <svg className="absolute bottom-1/2 right-1/4 w-12 h-12 text-white/10 animate-float-delayed" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="30" fill="none" stroke="currentColor" strokeWidth="6"/>
            <circle cx="50" cy="50" r="15" fill="currentColor"/>
          </svg>
        </div>

        {/* Floating Particles & Many More SVGs */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-primary rounded-full animate-float-particle"></div>
          <div className="absolute top-1/3 right-1/4 w-1.5 h-1.5 bg-primary rounded-full animate-float-particle-delayed"></div>
          <div className="absolute bottom-1/3 left-1/3 w-2 h-2 bg-primary rounded-full animate-float-particle-slow"></div>
          <div className="absolute bottom-1/4 right-1/3 w-1.5 h-1.5 bg-primary rounded-full animate-float-particle"></div>

          {/* Many Additional SVG Decorations */}
          <svg className="absolute top-16 left-1/3 w-16 h-16 text-primary/25 animate-spin-slow" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="3"/>
            <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="2"/>
          </svg>
          <svg className="absolute bottom-20 right-1/4 w-20 h-20 text-primary/30 animate-float" viewBox="0 0 100 100">
            <path d="M50,10 L60,40 L90,40 L65,60 L75,90 L50,70 L25,90 L35,60 L10,40 L40,40 Z" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/4 right-16 w-14 h-14 text-primary/25 animate-float-delayed" viewBox="0 0 100 100">
            <rect x="10" y="10" width="30" height="30" rx="5" fill="currentColor" transform="rotate(15 25 25)"/>
            <rect x="50" y="50" width="40" height="40" rx="5" fill="currentColor" transform="rotate(30 70 70)"/>
          </svg>
          <svg className="absolute bottom-1/3 left-16 w-18 h-18 text-primary/30 animate-float-slow" viewBox="0 0 100 100">
            <ellipse cx="50" cy="30" rx="30" ry="20" fill="currentColor"/>
            <ellipse cx="50" cy="70" rx="30" ry="20" fill="currentColor"/>
          </svg>
          <svg className="absolute top-3/4 left-1/2 w-22 h-22 text-primary/20 animate-float" viewBox="0 0 100 100">
            <polygon points="50,5 95,35 80,90 20,90 5,35" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/3 right-1/2 w-16 h-16 text-primary/35 animate-float-delayed" viewBox="0 0 100 100">
            <path d="M50,10 C70,10 90,30 90,50 C90,70 70,90 50,90 C30,90 10,70 10,50 C10,30 30,10 50,10 M50,30 C40,30 30,40 30,50 C30,60 40,70 50,70 C60,70 70,60 70,50 C70,40 60,30 50,30" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-2/3 left-1/4 w-24 h-24 text-primary/25 animate-float-slow" viewBox="0 0 100 100">
            <rect x="10" y="10" width="80" height="80" rx="20" fill="none" stroke="currentColor" strokeWidth="4"/>
            <circle cx="50" cy="50" r="20" fill="currentColor"/>
          </svg>
          <svg className="absolute top-1/2 left-16 w-20 h-20 text-primary/30 animate-float" viewBox="0 0 100 100">
            <path d="M20,50 L50,20 L80,50 L50,80 Z" fill="currentColor"/>
          </svg>
          <svg className="absolute bottom-1/4 left-1/3 w-18 h-18 text-primary/25 animate-float-delayed" viewBox="0 0 100 100">
            <polygon points="50,10 70,30 70,70 50,90 30,70 30,30" fill="currentColor"/>
          </svg>
        </div>
      </div>
    </div>
  )
}
