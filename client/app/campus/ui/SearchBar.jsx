import { useEffect, useRef } from 'react'
import useCampusStore from '../store/useCampusStore'
import { searchCampus } from '../data/searchIndex'
import { Search, X, Building2, GraduationCap, DoorOpen } from 'lucide-react'

export default function SearchBar({ fuseInstance }) {

  const {
    searchQuery, setSearchQuery,
    setSearchResults, searchResults,
    selectBuilding, selectRoom,
    rooms
  } = useCampusStore()

  const showDrop    = useCampusStore(s => s.isSearchDropOpen)
  const setShowDrop = useCampusStore(s => s.setSearchDropOpen)

  const justSelected = useRef(false)   // ← prevents dropdown reopening after pick

  useEffect(() => {
    // Skip re-search right after a selection was made
    if (justSelected.current) {
      justSelected.current = false
      return
    }

    if (!fuseInstance || !searchQuery.trim()) {
      setSearchResults([])
      setShowDrop(false)
      return
    }
    const res = searchCampus(fuseInstance, searchQuery)
    setSearchResults(res)
    setShowDrop(res.length > 0)
  }, [searchQuery, fuseInstance])

  function handleSelect(result) {
    justSelected.current = true   // ← mark BEFORE changing query
    setShowDrop(false)
    setSearchResults([])
    setSearchQuery(result.label)

    if (result.type === 'BUILDING') {
      selectBuilding(result.data)
    } else if (result.type === 'ROOM') {
      selectRoom(result.data)
    } else if (result.type === 'FACULTY') {
      const cabin = rooms?.find(r => r.id === result.data.cabinId)
    }
  }

  function renderTypeIcon(type) {
    if (type === 'BUILDING') return <Building2 size={16} color="#00e5ff" />
    if (type === 'FACULTY')  return <GraduationCap size={16} color="#a78bfa" />
    return <DoorOpen size={16} color="#10b981" />
  }

  return (
    <div style={S.wrap}>
      <div style={S.box}>
        <span style={S.icon}><Search size={16} color="#64748b" /></span>
        <input
          style={S.input}
          placeholder="Search room, faculty, building..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          onFocus={() => searchResults.length > 0 && !justSelected.current && setShowDrop(true)}
        />
        {searchQuery && (
          <button style={S.x}
            onClick={() => {
              justSelected.current = true
              setSearchQuery('')
              setSearchResults([])
              setShowDrop(false)
            }}>
            <X size={14} />
          </button>
        )}
      </div>

      {showDrop && (
        <div style={S.drop}>
          {searchResults.slice(0, 6).map(r => (
            <div key={r.id} style={S.row}
              onClick={() => handleSelect(r)}
              onMouseEnter={e => e.currentTarget.style.background = '#1e2535'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ display: 'flex', alignItems: 'center' }}>
                {renderTypeIcon(r.type)}
              </span>
              <div>
                <div style={S.rowLabel}>{r.label}</div>
                <div style={S.rowType}>{r.type}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

const S = {
 wrap: {
  position: 'relative',
  width: '100%',
  fontFamily: 'monospace'
},
  box: {
    display: 'flex', alignItems: 'center', gap: 10,
    background: 'rgba(10,12,16,0.92)',
    border: '1px solid #1e2535', borderRadius: 12,
    padding: '10px 16px', backdropFilter: 'blur(10px)'
  },
  icon: { display: 'flex', alignItems: 'center' },
  input: {
    flex: 1, background: 'transparent',
    border: 'none', outline: 'none',
    color: '#e2e8f0', fontSize: 13, fontFamily: 'inherit'
  },
  x: {
    background: 'none', border: 'none',
    color: '#29538e', cursor: 'pointer', fontSize: 14,
    display: 'flex', alignItems: 'center',
  },
  drop: {
    marginTop: 6,
    background: 'rgba(10,12,16,0.95)',
    border: '1px solid #1e2535', borderRadius: 12,
    overflow: 'hidden', backdropFilter: 'blur(10px)'
  },
  row: {
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '12px 16px', cursor: 'pointer', transition: 'background .15s'
  },
  rowLabel: { color: '#e2e8f0', fontSize: 13, fontWeight: 600 },
  rowType:  { color: '#d7dce3', fontSize: 10, marginTop: 2 }
}
