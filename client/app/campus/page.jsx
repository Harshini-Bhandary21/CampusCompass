'use client'

import dynamic from 'next/dynamic'

// The 3D scene relies on WebGL/canvas and window-only APIs, so it
// must never be rendered on the server.
const CampusApp = dynamic(() => import('./CampusApp'), { ssr: false })

export default function CampusPage() {
  return <CampusApp />
}
