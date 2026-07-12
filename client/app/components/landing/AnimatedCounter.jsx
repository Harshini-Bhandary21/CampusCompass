'use client'

import { useEffect, useRef, useState } from 'react'
import { useInView, animate } from 'framer-motion'

export default function AnimatedCounter({ value, duration = 1.4 }) {
  const match = String(value).match(/^(\d+)(.*)$/)
  const numeric = match ? parseInt(match[1], 10) : null
  const suffix = match ? match[2] : ''

  const ref = useRef(null)
  const isInView = useInView(ref, { once: true, margin: '-40px' })
  const [display, setDisplay] = useState(numeric !== null ? 0 : value)

  useEffect(() => {
    if (!isInView || numeric === null) return
    const controls = animate(0, numeric, {
      duration,
      ease: 'easeOut',
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    })
    return () => controls.stop()
  }, [isInView, numeric, duration])

  return <span ref={ref}>{numeric !== null ? `${display}${suffix}` : value}</span>
}
