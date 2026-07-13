export function resolveDestinationFromPath(pathname, { buildings = [], navGraph }) {
  if (!pathname) return null

  const cleanPath = pathname
    .split('?')[0]
    .split('#')[0]
    .replace(/^\/+/, '')
    .trim()

  if (!cleanPath) return null

  const sourceNodeId = findMainGateNodeId(navGraph)
  if (!sourceNodeId) return null

  const normalizedPath = cleanPath.toLowerCase().replace(/[^a-z0-9]/g, '')
  if (!normalizedPath) return null

  const matchingBuilding = buildings.find(building => matchesBuildingPath(building, normalizedPath))
  if (!matchingBuilding) return null

  return {
    buildingId: matchingBuilding.id,
    destinationNodeId: findDestinationNodeId(navGraph, matchingBuilding),
    sourceNodeId,
  }
}

function matchesBuildingPath(building, normalizedPath) {
  if (!building) return false

  const name = (building.name || '').toLowerCase().replace(/[^a-z0-9]/g, '')
  const id = (building.id || '').toLowerCase().replace(/[^a-z0-9]/g, '')

  if (!normalizedPath) return false
  if (name.includes(normalizedPath) || id.includes(normalizedPath)) return true

  const prefix = normalizedPath.match(/[a-z]+/)?.[0] || ''
  if (!prefix) return false

  return name.startsWith(prefix) || id.startsWith(prefix) || name.includes(prefix) || id.includes(prefix)
}

function findDestinationNodeId(navGraph, building) {
  const byExactId = navGraph?.nodes?.find(node => node.id === building.entryNodeId)
  if (byExactId) return byExactId.id

  const byBuildingId = navGraph?.nodes?.find(node => node.buildingId === building.id)
  if (byBuildingId) return byBuildingId.id

  return building.entryNodeId || null
}

function findMainGateNodeId(navGraph) {
  if (!navGraph?.nodes?.length) return null

  const gateNode = navGraph.nodes.find(node => {
    const label = (node.label || '').toLowerCase()
    return label.includes('main gate') || label.includes('main entry')
  })

  return gateNode?.id || null
}
