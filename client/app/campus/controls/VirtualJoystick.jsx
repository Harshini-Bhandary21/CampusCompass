import { useRef, useEffect, useCallback } from 'react'
import { glass } from '../utils/glass'

export default function VirtualJoystick({ onMove, size = 140 }) {

  const baseRef  = useRef(null)
  const stickRef = useRef(null)
  const activeId = useRef(null)
  const center   = useRef({ x: 0, y: 0 })

  const radius    = size / 2
  const stickSize = size * 0.38

  const getCenter = useCallback(() => {
    const rect = baseRef.current.getBoundingClientRect()
    return {
      x: rect.left + rect.width  / 2,
      y: rect.top  + rect.height / 2,
    }
  }, [])

  const updateStick = useCallback((cx, cy) => {
    const dx  = cx - center.current.x
    const dy  = cy - center.current.y
    const len = Math.sqrt(dx * dx + dy * dy)
    const max = radius - stickSize / 2 - 4

    const clampedX = len > max ? (dx / len) * max : dx
    const clampedY = len > max ? (dy / len) * max : dy

    if (stickRef.current) {
      stickRef.current.style.transform =
        `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`
    }

    onMove?.({
      x: clampedX / max,
      y: clampedY / max,
    })
  }, [radius, stickSize, onMove])

  const handleEnd = useCallback(() => {
    activeId.current = null
    if (stickRef.current) {
      stickRef.current.style.transform = 'translate(-50%, -50%)'
      stickRef.current.style.transition = 'transform 0.15s ease'
      setTimeout(() => {
        if (stickRef.current)
          stickRef.current.style.transition = 'transform 0.05s ease'
      }, 150)
    }
    onMove?.({ x: 0, y: 0 })
  }, [onMove])

  useEffect(() => {
    const el = baseRef.current
    if (!el) return

    const onTouchStart = (e) => {
      e.preventDefault()
      const t = e.changedTouches[0]
      activeId.current  = t.identifier
      center.current    = getCenter()
      updateStick(t.clientX, t.clientY)
    }
    const onTouchMove = (e) => {
      e.preventDefault()
      for (const t of e.changedTouches) {
        if (t.identifier === activeId.current)
          updateStick(t.clientX, t.clientY)
      }
    }
    const onTouchEnd = (e) => {
      for (const t of e.changedTouches) {
        if (t.identifier === activeId.current) handleEnd()
      }
    }

    // Desktop mouse
    const onMouseDown = (e) => {
      activeId.current = 'mouse'
      center.current   = getCenter()
      updateStick(e.clientX, e.clientY)
    }
    const onMouseMove = (e) => {
      if (activeId.current === 'mouse')
        updateStick(e.clientX, e.clientY)
    }
    const onMouseUp = () => {
      if (activeId.current === 'mouse') handleEnd()
    }

    el.addEventListener('touchstart', onTouchStart, { passive: false })
    el.addEventListener('touchmove',  onTouchMove,  { passive: false })
    el.addEventListener('touchend',   onTouchEnd)
    el.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup',   onMouseUp)

    return () => {
      el.removeEventListener('touchstart', onTouchStart)
      el.removeEventListener('touchmove',  onTouchMove)
      el.removeEventListener('touchend',   onTouchEnd)
      el.removeEventListener('mousedown',  onMouseDown)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup',   onMouseUp)
    }
  }, [getCenter, updateStick, handleEnd])

  return (
    <div
      ref={baseRef}
      style={{
        width:        size,
        height:       size,
        borderRadius: '50%',
        position:     'relative',
        touchAction:  'none',
        userSelect:   'none',
        ...glass,
        background:   'rgba(8,12,22,0.55)',
        border:       '1.5px solid rgba(0,229,255,0.15)',
        boxShadow:    '0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,229,255,0.05)',
      }}
    >
      {/* Direction indicators */}
      {[
        { top: '8%',  left: '50%', transform: 'translateX(-50%)' },
        { bottom: '8%',left: '50%', transform: 'translateX(-50%)' },
        { left: '8%', top: '50%',  transform: 'translateY(-50%)' },
        { right: '8%',top: '50%',  transform: 'translateY(-50%)' },
      ].map((style, i) => (
        <div key={i} style={{
          position:     'absolute',
          width:        6,
          height:       6,
          borderRadius: '50%',
          background:   'rgba(0,229,255,0.2)',
          ...style,
        }}/>
      ))}

      {/* Stick */}
      <div
        ref={stickRef}
        style={{
          width:        stickSize,
          height:       stickSize,
          borderRadius: '50%',
          background:   'radial-gradient(circle at 35% 35%, rgba(0,229,255,0.9), rgba(0,150,200,0.7))',
          border:       '1.5px solid rgba(0,229,255,0.6)',
          position:     'absolute',
          top:  '50%',
          left: '50%',
          transform:    'translate(-50%, -50%)',
          transition:   'transform 0.05s ease',
          boxShadow:    '0 0 16px rgba(0,229,255,0.35), 0 4px 12px rgba(0,0,0,0.4)',
        }}
      />
    </div>
  )
}
