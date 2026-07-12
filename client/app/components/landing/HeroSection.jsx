'use client'

import { useState } from 'react'
import Link from 'next/link'
import { ArrowRightIcon, PlayCircleIcon, CheckCircleIcon, CalendarDaysIcon, CpuChipIcon, UserGroupIcon } from '@heroicons/react/24/outline'

export default function HeroSection() {
  const [hoveredCell, setHoveredCell] = useState(null)

  return (
    <div className="relative overflow-hidden bg-transparent">
      {/* Dot-grid texture + soft glow, contained to the hero — no motion clutter */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute inset-0 bg-dot-grid [mask-image:linear-gradient(to_bottom,black_0%,black_65%,transparent_100%)]" />
        <div className="absolute -top-32 -left-32 w-[560px] h-[560px] rounded-full bg-gradient-to-br from-teal-200/40 to-emerald-200/20 blur-3xl" />
        <div className="absolute top-40 -right-40 w-[600px] h-[600px] rounded-full bg-gradient-to-br from-cyan-200/30 to-teal-100/20 blur-3xl" />
      </div>

      <div className="relative max-w-[1600px] mx-auto px-6 md:px-12 pt-20 sm:pt-24 pb-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-8 items-center">
          <div className="space-y-5 text-center lg:text-left animate-fade-in">
            <div className="eyebrow-badge">
              <CalendarDaysIcon className="w-3.5 h-3.5" />
              Built for MIT Academy of Engineering
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-display font-bold text-slate-900 leading-[1.15] tracking-tight">
              Timetables that
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">
                build themselves.
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-600 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              CampusCompass turns a department's faculty, room, and course spreadsheet into a
              conflict-free weekly timetable — using constraint-based optimization (Google
              OR-Tools CP-SAT) aligned with the NEP 2020 credit framework.
            </p>

            <div className="flex flex-wrap items-center gap-3 justify-center lg:justify-start pt-1">
              <Link href="/auth/signin" className="btn-primary !px-5 !py-2.5">
                Sign In
                <ArrowRightIcon className="w-4 h-4" />
              </Link>
              <a href="#demo" className="btn-secondary !px-5 !py-2.5">
                <PlayCircleIcon className="w-4 h-4" />
                Watch Demo
              </a>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-w-lg mx-auto lg:mx-0 pt-3">
              {[
                { icon: CpuChipIcon, text: 'Constraint Solver' },
                { icon: CheckCircleIcon, text: 'Conflict-Free' },
                { icon: UserGroupIcon, text: 'Multi-Role Access' },
              ].map((feature, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-white rounded-xl p-2.5 border border-slate-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all"
                >
                  <feature.icon className="h-3.5 w-3.5 text-teal-600 flex-shrink-0" />
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-center relative order-1 lg:order-2 animate-slide-in-bottom">
            <div className="relative w-full max-w-md lg:max-w-lg">
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl blur-3xl opacity-20" />

              {/* Floating accent chips — continuous ambient motion, not just entrance */}
              <div className="hidden sm:flex absolute -top-6 -left-8 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-lg text-xs font-semibold text-slate-700 animate-float z-10">
                <CheckCircleIcon className="w-3.5 h-3.5 text-emerald-500" />
                Schedule published
              </div>
              <div className="hidden sm:flex absolute -bottom-5 -right-6 items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-lg text-xs font-semibold text-slate-700 animate-float-delayed z-10">
                <CpuChipIcon className="w-3.5 h-3.5 text-teal-500" />
                Solving in progress
              </div>

              {/* Timetable Dashboard Mockup */}
              <div className="relative animate-float">
                <svg className="w-full" viewBox="0 0 500 600" preserveAspectRatio="xMidYMid meet">
                  <defs>
                    <linearGradient id="card-grad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#ffffff" />
                      <stop offset="100%" stopColor="#f8fafc" />
                    </linearGradient>
                    <linearGradient id="teal-grad" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#14b8a6" />
                      <stop offset="100%" stopColor="#10b981" />
                    </linearGradient>
                    <filter id="card-shadow">
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15" />
                    </filter>
                    <filter id="cell-glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur" />
                      <feMerge>
                        <feMergeNode in="coloredBlur" />
                        <feMergeNode in="SourceGraphic" />
                      </feMerge>
                    </filter>
                  </defs>

                  <rect x="20" y="20" width="460" height="560" rx="24" fill="url(#card-grad)" filter="url(#card-shadow)" stroke="#e2e8f0" strokeWidth="2" />

                  <rect x="40" y="40" width="420" height="60" rx="12" fill="url(#teal-grad)" opacity="0.1" />
                  <text x="60" y="65" fontSize="16" fontWeight="bold" fill="#0f172a">University Timetable</text>

                  <circle cx="420" cy="70" r="20" fill="#10b981" opacity="0.2" />
                  <path d="M 412 70 L 418 76 L 428 64" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round" />

                  <g transform="translate(40, 120)">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <g key={day}>
                        <rect
                          x={i * 85}
                          y="0"
                          width="80"
                          height="30"
                          rx="6"
                          fill="#f1f5f9"
                          style={{ opacity: hoveredCell?.col === i ? 0.8 : 1, transition: 'all 0.2s' }}
                        />
                        <text x={i * 85 + 40} y="20" fontSize="11" fontWeight="600" fill="#475569" textAnchor="middle">
                          {day}
                        </text>
                      </g>
                    ))}

                    {[0, 1, 2, 3, 4].map((row) => (
                      <g key={row}>
                        {[0, 1, 2, 3, 4].map((col) => {
                          const colors = [
                            ['#14b8a6', '#0d9488'],
                            ['#06b6d4', '#0891b2'],
                            ['#8b5cf6', '#7c3aed'],
                            ['#f59e0b', '#d97706'],
                            ['#10b981', '#059669'],
                          ]
                          const color = colors[(row + col) % 5]
                          const isHovered = hoveredCell?.row === row && hoveredCell?.col === col
                          const isRowHovered = hoveredCell?.row === row
                          const isColHovered = hoveredCell?.col === col
                          const shouldHighlight = isHovered || isRowHovered || isColHovered

                          return (
                            <g
                              key={col}
                              onMouseEnter={() => setHoveredCell({ row, col })}
                              onMouseLeave={() => setHoveredCell(null)}
                              style={{ cursor: 'pointer' }}
                            >
                              <rect
                                x={col * 85}
                                y={40 + row * 70}
                                width="80"
                                height="65"
                                rx="8"
                                fill={color[0]}
                                opacity={isHovered ? 0.5 : shouldHighlight ? 0.3 : 0.15}
                                filter={shouldHighlight ? 'url(#cell-glow)' : 'none'}
                                style={{
                                  transition: 'all 0.2s ease',
                                  transform: isHovered ? 'scale(1.05)' : 'scale(1)',
                                  transformOrigin: `${col * 85 + 40}px ${40 + row * 70 + 32.5}px`,
                                }}
                              />
                              <rect
                                x={col * 85 + 5}
                                y={45 + row * 70}
                                width="70"
                                height="8"
                                rx="4"
                                fill={color[1]}
                                style={{ transition: 'all 0.2s', filter: shouldHighlight ? 'brightness(1.3)' : 'brightness(1)' }}
                              />
                              <rect
                                x={col * 85 + 5}
                                y={58 + row * 70}
                                width="50"
                                height="6"
                                rx="3"
                                fill={color[0]}
                                opacity={shouldHighlight ? 0.8 : 0.5}
                                style={{ transition: 'all 0.2s' }}
                              />
                              <rect
                                x={col * 85 + 5}
                                y={68 + row * 70}
                                width="60"
                                height="6"
                                rx="3"
                                fill={color[0]}
                                opacity={shouldHighlight ? 0.6 : 0.3}
                                style={{ transition: 'all 0.2s' }}
                              />
                            </g>
                          )
                        })}
                      </g>
                    ))}
                  </g>

                  <g transform="translate(40, 510)">
                    <rect x="0" y="0" width="130" height="50" rx="10" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" />
                    <text x="65" y="22" fontSize="18" fontWeight="bold" fill="#10b981" textAnchor="middle">100%</text>
                    <text x="65" y="38" fontSize="10" fill="#059669" textAnchor="middle">Conflict Free</text>

                    <rect x="145" y="0" width="130" height="50" rx="10" fill="#f0fdfa" stroke="#14b8a6" strokeWidth="1.5" />
                    <text x="210" y="22" fontSize="18" fontWeight="bold" fill="#14b8a6" textAnchor="middle">CP-SAT</text>
                    <text x="210" y="38" fontSize="10" fill="#0d9488" textAnchor="middle">Solver Engine</text>

                    <rect x="290" y="0" width="130" height="50" rx="10" fill="#eff6ff" stroke="#06b6d4" strokeWidth="1.5" />
                    <text x="355" y="22" fontSize="18" fontWeight="bold" fill="#06b6d4" textAnchor="middle">3</text>
                    <text x="355" y="38" fontSize="10" fill="#0891b2" textAnchor="middle">User Roles</text>
                  </g>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
