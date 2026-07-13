import { useGLTF } from '@react-three/drei'
import { useEffect, useState } from 'react'
import * as THREE from 'three'
import useCampusStore from '../store/useCampusStore'

export default function CampusModel() {

  const { scene } = useGLTF('/campus/models/campus.glb')
  const { buildings, selectBuilding } = useCampusStore()
  const [hovered, setHovered] = useState(null)

  // Fix materials after GLB loads
  useEffect(() => {
    if (!scene) return

    scene.traverse((obj) => {
      if (!obj.isMesh) return

      // Fix normals
      if (obj.geometry) {
        obj.geometry.computeVertexNormals()
      }

      // Fix material
      if (obj.material) {
        const mats = Array.isArray(obj.material)
          ? obj.material
          : [obj.material]

        mats.forEach(mat => {
          // Black material fix
          if (mat.color) {
            const c = mat.color
            // Intentional black materials are skipped —
            // only ground-type objects get fixed
            if (c.r < 0.05 && c.g < 0.05 && c.b < 0.05) {
              if (obj.name.toLowerCase().includes('ground') ||
                  obj.name.toLowerCase().includes('floor')  ||
                  obj.name.toLowerCase().includes('road')   ||
                  obj.name.toLowerCase().includes('path')) {
                c.setRGB(0.3, 0.3, 0.3)
              }
            }
          }

          // Render both sides — fixes flipped normals
          mat.side = THREE.DoubleSide

          // Roughness adjust
          if (mat.roughness !== undefined) {
            mat.roughness = Math.max(mat.roughness, 0.4)
          }

          mat.needsUpdate = true
        })
      }

      // Shadows
      obj.receiveShadow = true
      obj.castShadow    = true
    })
  }, [scene])

  function handleClick(e) {
    e.stopPropagation()
    const meshName = e.object.name
    console.log('🖱️ Clicked:', meshName)

    const building = buildings.find(b =>
      b.meshName === meshName ||
      meshName.toLowerCase().includes(b.meshName.toLowerCase()) ||
      b.meshName.toLowerCase().includes(meshName.toLowerCase())
    )
    if (building) selectBuilding(building)
  }

  function handlePointerOver(e) {
    e.stopPropagation()
    setHovered(e.object.name)
    document.body.style.cursor = 'pointer'
  }

  function handlePointerOut() {
    setHovered(null)
    document.body.style.cursor = 'default'
  }

  return (
    <primitive
      object={scene}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    />
  )
}

useGLTF.preload('/campus/models/campus.glb')
