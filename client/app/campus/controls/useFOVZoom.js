import { useRef, useEffect } from 'react'

// FOV based zoom — lens zoom feel
// fovRef = camera reference from Canvas onCreated
export function useFOVZoom(fovRef, enabled = true) {

  const fov        = useRef(60)
  const MIN_FOV    = 20   // Max zoom in
  const MAX_FOV    = 80   // Max zoom out
  const FOV_SPEED  = 0.8

  function zoomIn(amount = 5) {
    if (!fovRef?.current) return
    if (typeof amount !== 'number' || isNaN(amount)) amount = 5
    fov.current = Math.max(MIN_FOV, fov.current - amount)
    fovRef.current.fov = fov.current
    fovRef.current.updateProjectionMatrix()
  }

  function zoomOut(amount = 5) {
    if (!fovRef?.current) return
    if (typeof amount !== 'number' || isNaN(amount)) amount = 5
    fov.current = Math.min(MAX_FOV, fov.current + amount)
    fovRef.current.fov = fov.current
    fovRef.current.updateProjectionMatrix()
  }

  function setFOV(val) {
    if (!fovRef?.current) return
    fov.current = Math.max(MIN_FOV, Math.min(MAX_FOV, val))
    fovRef.current.fov = fov.current
    fovRef.current.updateProjectionMatrix()
  }

  // Pinch zoom → FOV change
  useEffect(() => {
    if (!enabled) return

    let lastDist = null

    const onTouchStart = (e) => {
      if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX
        const dy = e.touches[0].clientY - e.touches[1].clientY
        lastDist = Math.sqrt(dx * dx + dy * dy)
      }
    }

    const onTouchMove = (e) => {
      if (e.touches.length !== 2 || lastDist === null) return
      e.preventDefault()

      const dx   = e.touches[0].clientX - e.touches[1].clientX
      const dy   = e.touches[0].clientY - e.touches[1].clientY
      const dist = Math.sqrt(dx * dx + dy * dy)
      const delta = (lastDist - dist) * 0.1

      setFOV(fov.current + delta)
      lastDist = dist
    }

    const onTouchEnd = (e) => {
      if (e.touches.length < 2) lastDist = null
    }

    // Mouse wheel zoom
    const onWheel = (e) => {
      const delta = e.deltaY * 0.05
      setFOV(fov.current + delta)
    }

    window.addEventListener('touchstart', onTouchStart, { passive: false })
    window.addEventListener('touchmove',  onTouchMove,  { passive: false })
    window.addEventListener('touchend',   onTouchEnd)
    window.addEventListener('wheel',      onWheel,      { passive: true })

    return () => {
      window.removeEventListener('touchstart', onTouchStart)
      window.removeEventListener('touchmove',  onTouchMove)
      window.removeEventListener('touchend',   onTouchEnd)
      window.removeEventListener('wheel',      onWheel)
    }
  }, [enabled, fovRef])

  return { zoomIn, zoomOut, setFOV, fovRef }
}
