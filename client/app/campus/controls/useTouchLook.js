import { useEffect, useRef } from 'react'

// Right-side drag = look around (yaw + pitch)
// Returns a ref with { yaw, pitch } deltas each frame
export function useTouchLook(enabled, sensitivity = 0.003) {

  const lookDelta = useRef({ yaw: 0, pitch: 0 })
  const lastTouch = useRef(null)
  const pinchDist = useRef(null)
  const zoomDelta = useRef(0)

  useEffect(() => {
    if (!enabled) {
      lookDelta.current = { yaw: 0, pitch: 0 }
      return
    }

    const isRightSide = (x) => x > window.innerWidth * 0.35

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        // Pinch start
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        pinchDist.current = Math.sqrt(dx * dx + dy * dy)
        lastTouch.current = null
        return
      }
      if (e.touches.length === 1) {
        const t = e.touches[0]
        if (isRightSide(t.clientX)) {
          lastTouch.current = { x: t.clientX, y: t.clientY }
        }
      }
    }

    const onTouchMove = (e) => {
      e.preventDefault()

      // Pinch zoom
      if (e.touches.length === 2 && pinchDist.current !== null) {
        const dx  = e.touches[0].clientX - e.touches[1].clientX
        const dy  = e.touches[0].clientY - e.touches[1].clientY
        const dist = Math.sqrt(dx * dx + dy * dy)
        zoomDelta.current += (pinchDist.current - dist) * 0.15
        pinchDist.current  = dist
        return
      }

      // Look around
      if (e.touches.length === 1 && lastTouch.current) {
        const t  = e.touches[0]
        if (!isRightSide(t.clientX)) return
        const dx = t.clientX - lastTouch.current.x
        const dy = t.clientY - lastTouch.current.y
        lookDelta.current.yaw   += dx * sensitivity
        lookDelta.current.pitch += dy * sensitivity
        lastTouch.current = { x: t.clientX, y: t.clientY }
      }
    }

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) pinchDist.current = null
      if (e.touches.length === 0) lastTouch.current = null
    }

    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd)

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
    }
  }, [enabled, sensitivity])

  // Call this each frame to consume deltas
  function consumeLook() {
    const val = { ...lookDelta.current }
    lookDelta.current = { yaw: 0, pitch: 0 }
    return val
  }

  function consumeZoom() {
    const val = zoomDelta.current
    zoomDelta.current = 0
    return val
  }

  return { consumeLook, consumeZoom }
}
