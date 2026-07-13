import Fuse from 'fuse.js'

export function buildSearchIndex(buildings, rooms) {

  const items = []

  buildings.forEach(b => {
    items.push({
      id: b.id,
      type: 'BUILDING',
      label: b.name,
      searchText: `${b.name} ${b.type} ${b.description}`,
      position: b.position,
      data: b
    })
  })

  rooms.forEach(r => {
    items.push({
      id: r.id,
      type: 'ROOM',
      label: `Room ${r.roomNumber}`,
      searchText: `${r.roomNumber} ${r.type} floor ${r.floor}`,
      position: r.position,
      data: r
    })
  })

  const fuse = new Fuse(items, {
    keys: ['searchText', 'label'],
    threshold: 0.4,
    includeScore: true
  })

  return { fuse, items }
}

export function searchCampus(fuse, query) {
  if (!query || query.trim() === '') return []
  return fuse.search(query).map(r => r.item)
}
