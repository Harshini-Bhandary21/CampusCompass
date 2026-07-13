import { Canvas } from '@react-three/fiber'
import { Sky } from '@react-three/drei'
import CampusModel      from './CampusModel'
import CameraController from './CameraController'
import NavPath          from './NavPath'
import ExploreControls  from '../controls/ExploreControls'

export default function CampusScene({ joystickRef, fovRef }) {
  return (
    <Canvas
      camera={{
        position: [0.0738, 110, 110],
        fov:      60,
        near:     0.1,
        far:      2000,
      }}
      shadows
      style={{ width: '100vw', height: '100vh' }}
      onCreated={({ gl, camera, scene }) => {
        gl.domElement.style.touchAction = 'none'
        if (fovRef) fovRef.current = camera

        const canvas = gl.domElement

        // Handle WebGL context loss (happens when canvas → 0x0 on minimize)
        canvas.addEventListener('webglcontextlost', (e) => {
          e.preventDefault()
          console.warn('⚠️ WebGL context lost')
        }, false)

        canvas.addEventListener('webglcontextrestored', () => {
          console.warn('✅ WebGL context restored — forcing re-render')

          // Force camera/projection to recalc with valid size
          const w = canvas.clientWidth
          const h = canvas.clientHeight
          if (w > 0 && h > 0) {
            camera.aspect = w / h
            camera.updateProjectionMatrix()
            gl.setSize(w, h)
          }

          // Mark all materials/textures for re-upload
          scene.traverse((obj) => {
            if (obj.material) {
              const mats = Array.isArray(obj.material) ? obj.material : [obj.material]
              mats.forEach(m => { m.needsUpdate = true })
            }
          })
        }, false)
      }}
    >
      {/* Ambient — lights everything evenly */}
      <ambientLight intensity={1.2} />

      {/* Sun — from above */}
      <directionalLight
        position={[50, 200, 50]}
        intensity={2.0}
        castShadow={false}
      />

      {/* Fill light — some light from below too */}
      <directionalLight
        position={[0, -100, 0]}
        intensity={0.8}
        color="#ffffff"
      />

      {/* Side light — from the left */}
      <directionalLight
        position={[-100, 100, 0]}
        intensity={0.6}
      />

      {/* Side light — from the right */}
      <directionalLight
        position={[100, 100, 0]}
        intensity={0.6}
      />

      <Sky sunPosition={[100, 80, 100]} />

      <CampusModel />
      <NavPath />
      <CameraController />
      <ExploreControls joystickRef={joystickRef} />
    </Canvas>
  )
}
