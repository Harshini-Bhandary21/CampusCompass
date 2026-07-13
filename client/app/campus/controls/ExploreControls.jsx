import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import useCampusStore from '../store/useCampusStore'
import { useTouchLook } from './useTouchLook'

const MOVE_SPEED    = 30
const LOOK_SPEED    = 0.01
const GROUND_OFFSET = 3
const MIN_HEIGHT    = 0
const MAX_HEIGHT    = 10
const PITCH_LIMIT   = Math.PI / 2.2

export default function ExploreControls({ joystickRef }) {

  const { camera } = useThree()

  const controlMode       = useCampusStore(s => s.controlMode)
  const navPath           = useCampusStore(s => s.navPath)
  const isFollowingRoute  = useCampusStore(s => s.isFollowingRoute)
  const isFollowPaused    = useCampusStore(s => s.isFollowPaused)
  const followProgress    = useCampusStore(s => s.followProgress)
  const setFollowProgress = useCampusStore(s => s.setFollowProgress)
  const setControlMode    = useCampusStore(s => s.setControlMode)
  const followSpeed = useCampusStore(s => s.followSpeed)
  const enabled = controlMode === 'EXPLORE'

  const yaw   = useRef(0)
  const pitch = useRef(-0.3)
  const vel   = useRef(new THREE.Vector3())

  const { consumeLook, consumeZoom } = useTouchLook(enabled)

  // Keyboard
  const keys = useRef({})
  useEffect(() => {
    const onDown = (e) => { keys.current[e.code] = true }
    const onUp   = (e) => { keys.current[e.code] = false }
    window.addEventListener('keydown', onDown)
    window.addEventListener('keyup',   onUp)
    return () => {
      window.removeEventListener('keydown', onDown)
      window.removeEventListener('keyup',   onUp)
    }
  }, [])

  // Mouse look
  const mouseLook = useRef({ active: false, lastX: 0, lastY: 0 })
  useEffect(() => {
    if (!enabled) return
    const onDown = (e) => {
      if (e.button === 2 || e.clientX > window.innerWidth * 0.35) {
        mouseLook.current = { active: true, lastX: e.clientX, lastY: e.clientY }
      }
    }
    const onMove = (e) => {
      if (!mouseLook.current.active) return
      const dx = e.clientX - mouseLook.current.lastX
      const dy = e.clientY - mouseLook.current.lastY
      yaw.current   -= dx * LOOK_SPEED
      pitch.current -= dy * LOOK_SPEED
      pitch.current  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current))
      mouseLook.current.lastX = e.clientX
      mouseLook.current.lastY = e.clientY
    }
    const onUp = () => { mouseLook.current.active = false }
    window.addEventListener('mousedown',   onDown)
    window.addEventListener('mousemove',   onMove)
    window.addEventListener('mouseup',     onUp)
    window.addEventListener('contextmenu', e => e.preventDefault())
    return () => {
      window.removeEventListener('mousedown',   onDown)
      window.removeEventListener('mousemove',   onMove)
      window.removeEventListener('mouseup',     onUp)
    }
  }, [enabled])

  useFrame((_, delta) => {
    if (!enabled) return
    const dt = Math.min(delta, 0.05)

    // ── Follow Route Mode ──────────────────
    if (isFollowingRoute && navPath.length >= 2) {
      if (!isFollowPaused) {
        followRouteUpdate(dt)
      }
      return
    }

    // ── Touch look ────────────────────────
    const look = consumeLook()
    yaw.current   -= look.yaw
    pitch.current -= look.pitch
    pitch.current  = Math.max(-PITCH_LIMIT, Math.min(PITCH_LIMIT, pitch.current))

    // ── Pinch zoom ────────────────────────
    const zoom = consumeZoom()
    if (Math.abs(zoom) > 0.1) {
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      dir.y = 0
      dir.normalize()
      camera.position.addScaledVector(dir, -zoom * 0.5)
    }

    // ── Joystick ──────────────────────────
    const joy  = joystickRef?.current ?? { x: 0, y: 0 }
    const joyX = joy.x ?? 0
    const joyY = joy.y ?? 0

    // ── Keyboard ──────────────────────────
    const kF = keys.current['KeyW'] || keys.current['ArrowUp']    ? 1 : 0
    const kB = keys.current['KeyS'] || keys.current['ArrowDown']  ? 1 : 0
    const kL = keys.current['KeyA'] || keys.current['ArrowLeft']  ? 1 : 0
    const kR = keys.current['KeyD'] || keys.current['ArrowRight'] ? 1 : 0

    const moveZ = -joyY + (-kF + kB)
    const moveX =  joyX + (-kL + kR)

    const forward = new THREE.Vector3(
      -Math.sin(yaw.current), 0, -Math.cos(yaw.current)
    )
    const right = new THREE.Vector3(
      Math.cos(yaw.current), 0, -Math.sin(yaw.current)
    )

    const moveVec = new THREE.Vector3()
    moveVec.addScaledVector(forward, moveZ * MOVE_SPEED * dt)
    moveVec.addScaledVector(right,   moveX * MOVE_SPEED * dt)

    vel.current.lerp(moveVec, 0.2)
    camera.position.add(vel.current)

    camera.position.y = Math.max(MIN_HEIGHT, Math.min(MAX_HEIGHT, camera.position.y))
    if (camera.position.y < GROUND_OFFSET) camera.position.y = GROUND_OFFSET

    const qYaw   = new THREE.Quaternion()
    const qPitch = new THREE.Quaternion()
    qYaw.setFromAxisAngle(new THREE.Vector3(0, 1, 0), yaw.current)
    qPitch.setFromAxisAngle(new THREE.Vector3(1, 0, 0), pitch.current)
    camera.quaternion.copy(qYaw).multiply(qPitch)
  })

  function followRouteUpdate(dt) {
    if (navPath.length < 2) return

    const totalNodes = navPath.length
    let progress     = followProgress

    // Cumulative distances
    const dists = [0]
    for (let i = 1; i < totalNodes; i++) {
      const a = navPath[i - 1].position
      const b = navPath[i].position
      dists.push(dists[i-1] + Math.sqrt(
        (b.x-a.x)**2 + (b.y-a.y)**2 + (b.z-a.z)**2
      ))
    }
    const totalDist = dists[totalNodes - 1]
    if (totalDist === 0) return

    // Advance
    progress += (12 * followSpeed * dt) / totalDist
    if (progress >= 1) {
      setFollowProgress(1)

      // Sync yaw/pitch to the camera's current facing direction.
      // Without this, the normal-movement code below will overwrite
      // camera.quaternion using stale yaw/pitch refs (frozen since
      // before navigation started), snapping the camera back and
      // making it feel "stuck" once the route finishes.
      const dir = new THREE.Vector3()
      camera.getWorldDirection(dir)
      yaw.current   = Math.atan2(-dir.x, -dir.z)
      pitch.current = Math.max(
        -PITCH_LIMIT,
        Math.min(PITCH_LIMIT, Math.asin(Math.max(-1, Math.min(1, dir.y))))
      )

      // Auto stop when done
      useCampusStore.getState().toggleFollowRoute()
      return
    }
    setFollowProgress(progress)

    // Current position on path
    const traveled = progress * totalDist
    let segIdx = 0
    for (let i = 1; i < totalNodes; i++) {
      if (dists[i] >= traveled) { segIdx = i - 1; break }
    }

    const segStart = navPath[segIdx].position
    const segEnd   = navPath[Math.min(segIdx + 1, totalNodes - 1)].position
    const segLen   = dists[segIdx + 1] - dists[segIdx]
    const segT     = segLen > 0 ? (traveled - dists[segIdx]) / segLen : 0

    const pos = {
      x: segStart.x + (segEnd.x - segStart.x) * segT,
      z: segStart.z + (segEnd.z - segStart.z) * segT,
    }

    // Look ahead
    const nextIdx   = Math.min(segIdx + 2, totalNodes - 1)
    const lookAhead = navPath[nextIdx].position

    camera.position.lerp(
      new THREE.Vector3(pos.x, GROUND_OFFSET, pos.z), 0.08
    )
    camera.lookAt(new THREE.Vector3(lookAhead.x, GROUND_OFFSET, lookAhead.z))
  }

  return null
}
