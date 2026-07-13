import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import useCampusStore from '../store/useCampusStore'

export default function NavPath() {

  const { navPath, isNavigating } = useCampusStore()
  const matRef = useRef()

  const tubeGeo = useMemo(() => {
    if (!navPath || navPath.length < 2) return null
    const pts = navPath.map(n =>
      new THREE.Vector3(n.position.x, n.position.y + 0.4, n.position.z)
    )
    const curve = new THREE.CatmullRomCurve3(pts)
    return new THREE.TubeGeometry(curve, pts.length * 8, 0.25, 8, false)
  }, [navPath])

  useFrame(({ clock }) => {
    if (matRef.current) {
      matRef.current.emissiveIntensity =
        0.6 + Math.sin(clock.getElapsedTime() * 3) * 0.3
    }
  })

  if (!isNavigating || !tubeGeo) return null

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshStandardMaterial
          ref={matRef}
          color="#e41010"
          emissive="#720f67"
          emissiveIntensity={0.8}
          transparent
          opacity={0.9}
        />
      </mesh>

      {navPath.map((node, i) => (
        <mesh
          key={node.id}
          position={[node.position.x, node.position.y + 0.8, node.position.z]}
        >
          <sphereGeometry args={[0.7, 12, 12]} />
          <meshStandardMaterial
            color={
              i === 0 ? '#00ff88' :
              i === navPath.length - 1 ? '#ff4444' :
              '#00e5ff'
            }
            emissive={
              i === 0 ? '#00ff88' :
              i === navPath.length - 1 ? '#ff4444' :
              '#00e5ff'
            }
            emissiveIntensity={0.7}
          />
        </mesh>
      ))}
    </group>
  )
}
