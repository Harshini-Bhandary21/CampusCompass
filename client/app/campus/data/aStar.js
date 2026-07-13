export function aStar(graph, startId, endId) {

  if (!graph || !startId || !endId) return []
  if (startId === endId) return []

  // Adjacency list
  const adjacency = {}
  graph.nodes.forEach(node => {
    adjacency[node.id] = []
  })
  graph.edges.forEach(edge => {
    if (adjacency[edge.from]) {
      adjacency[edge.from].push({ id: edge.to, weight: edge.weight })
    }
    if (adjacency[edge.to]) {
      adjacency[edge.to].push({ id: edge.from, weight: edge.weight })
    }
  })

  // Node map
  const nodeMap = {}
  graph.nodes.forEach(n => { nodeMap[n.id] = n })

  // Heuristic — straight line distance
  function heuristic(aId, bId) {
    const a = nodeMap[aId]?.position
    const b = nodeMap[bId]?.position
    if (!a || !b) return 0
    return Math.sqrt(
      Math.pow(a.x - b.x, 2) +
      Math.pow(a.y - b.y, 2) +
      Math.pow(a.z - b.z, 2)
    )
  }

  const openSet  = new Set([startId])
  const cameFrom = {}
  const gScore   = { [startId]: 0 }
  const fScore   = { [startId]: heuristic(startId, endId) }

  while (openSet.size > 0) {

    // Lowest fScore
    let current = null
    let lowestF = Infinity
    openSet.forEach(id => {
      const f = fScore[id] ?? Infinity
      if (f < lowestF) { lowestF = f; current = id }
    })

    if (!current) break

    if (current === endId) {
      const path = []
      let node = endId
      while (node) {
        path.unshift(nodeMap[node])
        node = cameFrom[node]
      }
      return path
    }

    openSet.delete(current)

    for (const neighbor of (adjacency[current] || [])) {
      const tentativeG = (gScore[current] ?? Infinity) + neighbor.weight
      if (tentativeG < (gScore[neighbor.id] ?? Infinity)) {
        cameFrom[neighbor.id] = current
        gScore[neighbor.id]   = tentativeG
        fScore[neighbor.id]   = tentativeG + heuristic(neighbor.id, endId)
        openSet.add(neighbor.id)
      }
    }
  }

  return []
}
