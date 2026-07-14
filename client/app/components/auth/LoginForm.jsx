'use client'

import { useState, useEffect } from 'react'
import { ArrowRightIcon, HomeIcon, EyeIcon, EyeSlashIcon } from '@heroicons/react/24/outline'
import Link from 'next/link'

const BACKGROUND_IMAGES = ['/hub/bg1.png', '/hub/bg2.png', '/hub/bg3.png']

export default function LoginForm({
  email,
  setEmail,
  password,
  setPassword,
  error,
  loading,
  onSubmit,
}) {
  const [showPassword, setShowPassword] = useState(false)
  const [bgIndex, setBgIndex] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => {
      setBgIndex(prev => (prev + 1) % BACKGROUND_IMAGES.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Rotating background photography */}
      {BACKGROUND_IMAGES.map((src, index) => (
        <div
          key={src}
          className="absolute inset-0"
          style={{
            backgroundImage: `url(${src})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            opacity: bgIndex === index ? 1 : 0,
            transition: 'opacity 1.2s ease-in-out',
          }}
        />
      ))}
      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/40 to-black/60" />

      {/* Top Left Navigation */}
      <Link
        href="/"
        className="absolute top-4 left-4 z-20 flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-white/10 backdrop-blur-sm hover:bg-white/20 rounded-lg border border-white/20 transition-all"
      >
        <HomeIcon className="h-4 w-4" />
        Home
      </Link>

      <div className="relative z-10 w-full max-w-md px-4 py-10">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-white drop-shadow-sm">CampusCompass</h1>
          <p className="text-sm text-white/85 mt-2 max-w-sm mx-auto">
            One login for students, teachers, and department coordinators — we&apos;ll take you straight to the right dashboard.
          </p>
        </div>

        <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl p-6 border border-white/40">
          <div className="text-center mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-1">Welcome Back</h2>
            <p className="text-sm text-gray-600">Sign in to access your dashboard</p>
          </div>

          <form className="space-y-4" onSubmit={onSubmit}>
            <div>
              <label htmlFor="email-address" className="block text-sm font-semibold text-gray-800 mb-2">
                Email Address
              </label>
              <input
                id="email-address"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="w-full px-3 py-3 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                placeholder="you@mitaoe.ac.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-800 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  required
                  className="w-full px-3 py-3 pr-10 border border-gray-300 rounded-lg bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-all text-sm"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-600 text-sm text-center bg-red-50 p-3 rounded-lg border border-red-200">
                {error}
              </div>
            )}

            <div className="pt-2">
              <button
                type="submit"
                disabled={loading}
                className="group w-full flex items-center justify-center py-3 px-6 text-sm font-semibold text-white bg-gradient-primary rounded-lg hover:shadow-lg hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 transition-all duration-300"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRightIcon className="h-4 w-4 ml-3 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </form>

          <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
            <h3 className="text-xs font-semibold text-gray-800 mb-1">Need help signing in?</h3>
            <p className="text-xs text-gray-600">
              Use the email and password issued by your department. Your role is detected automatically — there&apos;s nothing else to select.
            </p>
          </div>
        </div>

        {/* Social links */}
        <div className="flex gap-5 justify-center mt-6">
          <a href="https://www.facebook.com/mitaoeofficial/" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.469h3.047V7.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
          </a>
          <a href="https://www.instagram.com/mitacademyofengineering/?hl=en" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm3.98-10.956a1.44 1.44 0 100 2.88 1.44 1.44 0 000-2.88z" />
            </svg>
          </a>
          <a href="https://www.linkedin.com/school/mit-academy-of-engineering/posts/?feedView=all" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
            </svg>
          </a>
          <a href="https://x.com/MITAOE" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
          </a>
          <a href="https://www.youtube.com/@MITAcademyOfEngineering" target="_blank" rel="noreferrer" className="text-white/80 hover:text-white transition-colors">
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.5 12 3.5 12 3.5s-7.505 0-9.377.55a3.015 3.015 0 0 0-2.122 2.136C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.55 9.376.55 9.376.55s7.505 0 9.377-.55a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
          </a>
        </div>

        {/* Slider dots */}
        <div className="flex gap-2 justify-center mt-4">
          {BACKGROUND_IMAGES.map((_, index) => (
            <button
              key={index}
              type="button"
              aria-label={`Show background ${index + 1}`}
              onClick={() => setBgIndex(index)}
              className={`h-1.5 rounded-full transition-all ${bgIndex === index ? 'w-6 bg-white' : 'w-1.5 bg-white/40'}`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
