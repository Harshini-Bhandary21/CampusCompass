'use client'

import { useState } from 'react'
import { BuildingOfficeIcon, UserGroupIcon, ArrowRightIcon, CalendarDaysIcon, ChartBarIcon, ClockIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function HeroSection() {
  const [hoveredCell, setHoveredCell] = useState(null)
  return (
    <div className="relative overflow-hidden bg-transparent">
      {/* Enhanced Decorative SVG Background */}
      <div className="absolute inset-0 overflow-hidden">
        <svg className="absolute w-full h-full" viewBox="0 0 1200 800" preserveAspectRatio="xMidYMid slice">
          <defs>
            <linearGradient id="hero-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.08" />
            </linearGradient>
            <linearGradient id="hero-grad-2" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#14b8a6" stopOpacity="0.1" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Animated gradient orbs */}
          <circle cx="200" cy="150" r="300" fill="url(#hero-grad-1)">
            <animate attributeName="r" values="300;340;300" dur="8s" repeatCount="indefinite"/>
            <animate attributeName="cx" values="200;250;200" dur="15s" repeatCount="indefinite"/>
          </circle>
          <circle cx="1000" cy="600" r="400" fill="url(#hero-grad-1)">
            <animate attributeName="r" values="400;440;400" dur="10s" repeatCount="indefinite"/>
            <animate attributeName="cy" values="600;550;600" dur="12s" repeatCount="indefinite"/>
          </circle>

          {/* Floating geometric shapes */}
          <g opacity="0.15">
            <rect x="100" y="100" width="60" height="60" fill="#14b8a6" rx="8" transform="rotate(45 130 130)">
              <animateTransform attributeName="transform" type="rotate" from="45 130 130" to="405 130 130" dur="20s" repeatCount="indefinite"/>
            </rect>
            <circle cx="900" cy="200" r="30" fill="#10b981">
              <animate attributeName="cy" values="200;180;200" dur="4s" repeatCount="indefinite"/>
            </circle>
            <polygon points="1100,100 1130,140 1100,180 1070,140" fill="#06b6d4">
              <animateTransform attributeName="transform" type="rotate" from="0 1100 140" to="360 1100 140" dur="15s" repeatCount="indefinite"/>
            </polygon>
          </g>

          {/* Flowing waves */}
          <path d="M 0 400 Q 300 350 600 400 T 1200 400" stroke="url(#hero-grad-2)" strokeWidth="3" fill="none" opacity="0.2">
            <animate attributeName="d" values="M 0 400 Q 300 350 600 400 T 1200 400;M 0 400 Q 300 450 600 400 T 1200 400;M 0 400 Q 300 350 600 400 T 1200 400" dur="12s" repeatCount="indefinite"/>
          </path>
          <path d="M 0 450 Q 300 400 600 450 T 1200 450" stroke="#14b8a6" strokeWidth="2" fill="none" opacity="0.15">
            <animate attributeName="d" values="M 0 450 Q 300 400 600 450 T 1200 450;M 0 450 Q 300 500 600 450 T 1200 450;M 0 450 Q 300 400 600 450 T 1200 450" dur="10s" repeatCount="indefinite"/>
          </path>

          {/* Particle dots */}
          <g opacity="0.3">
            <circle cx="150" cy="300" r="3" fill="#14b8a6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3s" repeatCount="indefinite"/>
            </circle>
            <circle cx="400" cy="250" r="4" fill="#10b981">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4s" repeatCount="indefinite"/>
            </circle>
            <circle cx="800" cy="350" r="3" fill="#06b6d4">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="3.5s" repeatCount="indefinite"/>
            </circle>
            <circle cx="1050" cy="450" r="4" fill="#14b8a6">
              <animate attributeName="opacity" values="0.3;0.8;0.3" dur="4.5s" repeatCount="indefinite"/>
            </circle>
          </g>
        </svg>
      </div>

      <div className="relative max-w-[1600px] mx-auto px-6 md:px-12 pt-20 sm:pt-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-10 items-center">
          <div className="space-y-6 text-center lg:text-left animate-fade-up">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
              Eklavya Presents
              <span className="block text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600 mt-2">
                Automated Timetable Scheduler
              </span>
            </h1>

            <p className="text-base sm:text-lg text-gray-700 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              Intelligent platform generating optimized university timetables aligned with NEP 2020 credit-based, multidisciplinary framework using CP-SAT, Heuristic Search, Gale-Shapley, and Genetic Algorithms.
            </p>

            <div className="grid grid-cols-2 gap-3 max-w-lg mx-auto lg:mx-0">
              {[
                { icon: ChartBarIcon, text: 'AI Optimization', color: 'teal' },
                { icon: ClockIcon, text: 'Real-time Updates', color: 'cyan' },
                { icon: CheckCircleIcon, text: 'Zero Conflicts', color: 'emerald' },
                { icon: UserGroupIcon, text: 'Multi-Role Access', color: 'slate' }
              ].map((feature, i) => (
                <div key={i} className="flex items-center text-sm text-slate-700 bg-white rounded-xl p-3 border border-slate-200 shadow-sm hover:shadow-md transition-all">
                  <div className={`p-1.5 rounded-lg bg-${feature.color}-100 mr-2`}>
                    <feature.icon className={`h-4 w-4 text-${feature.color}-600 flex-shrink-0`} />
                  </div>
                  <span className="font-medium">{feature.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 justify-center lg:justify-start pt-2">
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-teal-200 shadow-sm">
                <CalendarDaysIcon className="h-5 w-5 text-teal-600" />
                <span className="text-sm font-medium text-slate-700">NEP 2020 Compliant</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg border border-emerald-200 shadow-sm">
                <CheckCircleIcon className="h-5 w-5 text-emerald-600" />
                <span className="text-sm font-medium text-slate-700">Instant Generation</span>
              </div>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end relative order-1 lg:order-2 animate-slide-right">
            <div className="relative w-full max-w-md lg:max-w-lg">
              {/* Enhanced Decorative SVG Elements */}
              <svg className="absolute -top-10 -right-10 w-40 h-40 text-teal-200 opacity-40" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1.5" strokeDasharray="5,5">
                  <animate attributeName="r" values="45;50;45" dur="3s" repeatCount="indefinite"/>
                  <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite"/>
                </circle>
                <circle cx="50" cy="50" r="35" fill="none" stroke="currentColor" strokeWidth="2">
                  <animate attributeName="r" values="35;40;35" dur="3s" repeatCount="indefinite"/>
                </circle>
                <circle cx="50" cy="50" r="25" fill="currentColor" opacity="0.2">
                  <animate attributeName="r" values="25;28;25" dur="2s" repeatCount="indefinite"/>
                </circle>
              </svg>

              <svg className="absolute -bottom-10 -left-10 w-40 h-40 text-emerald-200 opacity-40" viewBox="0 0 100 100">
                <polygon points="50,15 85,85 15,85" fill="none" stroke="currentColor" strokeWidth="2">
                  <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="20s" repeatCount="indefinite"/>
                </polygon>
                <circle cx="50" cy="50" r="20" fill="currentColor" opacity="0.2"/>
                <path d="M 30 50 L 70 50 M 50 30 L 50 70" stroke="currentColor" strokeWidth="2" opacity="0.5"/>
              </svg>

              <svg className="absolute top-1/2 -left-20 w-32 h-32 text-cyan-200 opacity-30" viewBox="0 0 100 100">
                <rect x="25" y="25" width="50" height="50" fill="none" stroke="currentColor" strokeWidth="2" rx="8">
                  <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="360 50 50" dur="15s" repeatCount="indefinite"/>
                </rect>
              </svg>

              <svg className="absolute top-10 -right-16 w-24 h-24 text-teal-300 opacity-35" viewBox="0 0 100 100">
                <path d="M 50 10 L 90 50 L 50 90 L 10 50 Z" fill="none" stroke="currentColor" strokeWidth="2">
                  <animateTransform attributeName="transform" type="rotate" from="0 50 50" to="-360 50 50" dur="18s" repeatCount="indefinite"/>
                </path>
              </svg>

              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-3xl blur-3xl opacity-20 animate-pulse"></div>

              {/* Timetable Dashboard Mockup */}
              <div className="relative">
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
                      <feDropShadow dx="0" dy="4" stdDeviation="8" floodOpacity="0.15"/>
                    </filter>
                    <filter id="cell-glow">
                      <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
                      <feMerge>
                        <feMergeNode in="coloredBlur"/>
                        <feMergeNode in="SourceGraphic"/>
                      </feMerge>
                    </filter>
                  </defs>

                  {/* Main Card */}
                  <rect x="20" y="20" width="460" height="560" rx="24" fill="url(#card-grad)" filter="url(#card-shadow)" stroke="#e2e8f0" strokeWidth="2"/>

                  {/* Header */}
                  <rect x="40" y="40" width="420" height="60" rx="12" fill="url(#teal-grad)" opacity="0.1"/>
                  <text x="60" y="65" fontSize="16" fontWeight="bold" fill="#0f172a">University Timetable</text>

                  {/* Success Badge */}
                  <circle cx="420" cy="70" r="20" fill="#10b981" opacity="0.2"/>
                  <path d="M 412 70 L 418 76 L 428 64" stroke="#10b981" strokeWidth="2.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>

                  {/* Timetable Grid */}
                  <g transform="translate(40, 120)">
                    {/* Days Header */}
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((day, i) => (
                      <g key={day}>
                        <rect
                          x={i * 85}
                          y="0"
                          width="80"
                          height="30"
                          rx="6"
                          fill="#f1f5f9"
                          style={{
                            opacity: hoveredCell?.col === i ? 0.8 : 1,
                            transition: 'all 0.2s'
                          }}
                        />
                        <text x={i * 85 + 40} y="20" fontSize="11" fontWeight="600" fill="#475569" textAnchor="middle">{day}</text>
                      </g>
                    ))}

                    {/* Time Slots */}
                    {[0, 1, 2, 3, 4].map((row) => (
                      <g key={row}>
                        {[0, 1, 2, 3, 4].map((col) => {
                          const colors = [
                            ['#14b8a6', '#0d9488'],
                            ['#06b6d4', '#0891b2'],
                            ['#8b5cf6', '#7c3aed'],
                            ['#f59e0b', '#d97706'],
                            ['#10b981', '#059669']
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
                                  transformOrigin: `${col * 85 + 40}px ${40 + row * 70 + 32.5}px`
                                }}
                              />
                              <rect
                                x={col * 85 + 5}
                                y={45 + row * 70}
                                width="70"
                                height="8"
                                rx="4"
                                fill={color[1]}
                                style={{
                                  transition: 'all 0.2s',
                                  filter: shouldHighlight ? 'brightness(1.3)' : 'brightness(1)'
                                }}
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

                  {/* Stats Footer */}
                  <g transform="translate(40, 510)">
                    <rect x="0" y="0" width="130" height="50" rx="10" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5"/>
                    <text x="65" y="22" fontSize="18" fontWeight="bold" fill="#10b981" textAnchor="middle">100%</text>
                    <text x="65" y="38" fontSize="10" fill="#059669" textAnchor="middle">Conflict Free</text>

                    <rect x="145" y="0" width="130" height="50" rx="10" fill="#f0fdfa" stroke="#14b8a6" strokeWidth="1.5"/>
                    <text x="210" y="22" fontSize="18" fontWeight="bold" fill="#14b8a6" textAnchor="middle">95%</text>
                    <text x="210" y="38" fontSize="10" fill="#0d9488" textAnchor="middle">Optimized</text>

                    <rect x="290" y="0" width="130" height="50" rx="10" fill="#eff6ff" stroke="#06b6d4" strokeWidth="1.5"/>
                    <text x="355" y="22" fontSize="18" fontWeight="bold" fill="#06b6d4" textAnchor="middle">3</text>
                    <text x="355" y="38" fontSize="10" fill="#0891b2" textAnchor="middle">Options</text>
                  </g>

                  {/* Floating Elements */}
                  <circle cx="450" cy="150" r="8" fill="#14b8a6" opacity="0.3">
                    <animate attributeName="cy" values="150;145;150" dur="2s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="470" cy="200" r="6" fill="#10b981" opacity="0.3">
                    <animate attributeName="cy" values="200;195;200" dur="2.5s" repeatCount="indefinite"/>
                  </circle>
                  <circle cx="30" cy="300" r="7" fill="#06b6d4" opacity="0.3">
                    <animate attributeName="cy" values="300;295;300" dur="3s" repeatCount="indefinite"/>
                  </circle>
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
