import { useRef } from 'react'
import { useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import useCampusStore from '../store/useCampusStore'
import { BUILDING_CAMERAS, ROOM_CAMERAS } from '../data/cameraConfigs'

const CAMPUS_CENTER = new THREE.Vector3(0.0338, 0, -1.5)
const OVERVIEW_POS  = new THREE.Vector3(0.0338, 180, 120)

function toV3(obj) {
  return new THREE.Vector3(obj.x, obj.y, obj.z)
}

function resolveDest(cameraMode, cameraTarget, buildingId, roomId) {
  if (cameraMode === 'OVERVIEW' || !cameraTarget) {
    return { position: OVERVIEW_POS.clone(), lookAt: CAMPUS_CENTER.clone() }
  }
  if (cameraMode === 'BUILDING') {
    const cfg = buildingId && BUILDING_CAMERAS[buildingId]
    if (cfg) return { position: toV3(cfg.position), lookAt: toV3(cfg.lookAt) }
    // fallback
    console.warn(`[Camera] No config for building "${buildingId}"`)
    return {
      position: new THREE.Vector3(cameraTarget.x, cameraTarget.y + 60, cameraTarget.z + 80),
      lookAt:   new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z),
    }
  }
  if (cameraMode === 'ROOM') {
    const cfg = roomId && ROOM_CAMERAS[roomId]
    if (cfg) return { position: toV3(cfg.position), lookAt: toV3(cfg.lookAt) }
    console.warn(`[Camera] No config for room "${roomId}"`)
    return {
      position: new THREE.Vector3(cameraTarget.x + 15, cameraTarget.y + 10, cameraTarget.z + 15),
      lookAt:   new THREE.Vector3(cameraTarget.x, cameraTarget.y, cameraTarget.z),
    }
  }
  return { position: OVERVIEW_POS.clone(), lookAt: CAMPUS_CENTER.clone() }
}

export default function CameraController() {
  const { camera }  = useThree()
  const controlsRef = useRef()

  const cameraTarget      = useCampusStore(s => s.cameraTarget)
  const cameraMode        = useCampusStore(s => s.cameraMode)
  const controlMode       = useCampusStore(s => s.controlMode)
  const selectedBuildingId = useCampusStore(s => s.selectedBuildingId)
  const selectedRoomId    = useCampusStore(s => s.selectedRoomId)

  const isAnimating  = useRef(false)
  const prevState    = useRef({ mode: 'OVERVIEW', buildingId: null, roomId: null })
  const targetPos    = useRef(OVERVIEW_POS.clone())
  const targetLookAt = useRef(CAMPUS_CENTER.clone())

  const modeChanged      = prevState.current.mode       !== cameraMode
  const buildingChanged  = prevState.current.buildingId !== selectedBuildingId
  const roomChanged      = prevState.current.roomId     !== selectedRoomId

  if (controlMode === 'ORBIT' && (modeChanged || buildingChanged || roomChanged)) {
    prevState.current = { mode: cameraMode, buildingId: selectedBuildingId, roomId: selectedRoomId }
    isAnimating.current = true

    const dest = resolveDest(cameraMode, cameraTarget, selectedBuildingId, selectedRoomId)
    targetPos.current.copy(dest.position)
    targetLookAt.current.copy(dest.lookAt)
  }

  useFrame(() => {
    if (controlMode !== 'ORBIT') return
    if (!isAnimating.current || !controlsRef.current) return

    camera.position.lerp(targetPos.current, 0.06)
    controlsRef.current.target.lerp(targetLookAt.current, 0.06)
    controlsRef.current.update()

    const d1 = camera.position.distanceTo(targetPos.current)
    const d2 = controlsRef.current.target.distanceTo(targetLookAt.current)
    if (d1 < 0.5 && d2 < 0.5) isAnimating.current = false
  })

  if (controlMode === 'EXPLORE') return null

  return (
    <OrbitControls
      ref={controlsRef}
      enableDamping
      dampingFactor={0.08}
      minDistance={10}
      maxDistance={500}
      maxPolarAngle={Math.PI / 2.1}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      touches={{ ONE: THREE.TOUCH.ROTATE, TWO: THREE.TOUCH.DOLLY_PAN }}
      mouseButtons={{ LEFT: THREE.MOUSE.ROTATE, MIDDLE: THREE.MOUSE.DOLLY, RIGHT: THREE.MOUSE.PAN }}
    />
  )
}
