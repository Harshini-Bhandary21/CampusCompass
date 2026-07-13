import { Compass, X, ArrowRight } from 'lucide-react'
import useCampusStore from '../store/useCampusStore'
import { aStar } from '../data/aStar'

export default function NavigationPanel() {

  const navGraph       = useCampusStore(s => s.navGraph)
  const navOrigin      = useCampusStore(s => s.navOrigin)
  const navDestination = useCampusStore(s => s.navDestination)
  const setNavOrigin   = useCampusStore(s => s.setNavOrigin)
  const setNavDest     = useCampusStore(s => s.setNavDestination)
  const setNavPath     = useCampusStore(s => s.setNavPath)
  const clearNav       = useCampusStore(s => s.clearNav)
  const isNavigating   = useCampusStore(s => s.isNavigating)

  const open    = useCampusStore(s => s.isNavPanelOpen)
  const setOpen = useCampusStore(s => s.setNavPanelOpen)

  function handleNavigate() {
    if (!navOrigin || !navDestination || !navGraph) {
      alert('Please select both FROM and TO locations')
      return
    }
    const path = aStar(navGraph, navOrigin, navDestination)
    if (path.length > 0) {
      setNavPath(path)
      useCampusStore.getState().setControlMode('EXPLORE')
    } else {
      alert('No path found!')
    }
  }

  return (
    <>
      <button
        onClick={() => setOpen(!open)}
        style={{
          position: 'absolute',
          bottom: 30,
          left: 30,
          background: 'rgba(10,12,16,0.92)',
          border: '1px solid #1e2535',
          color: '#e2e8f0',
          padding: '10px 20px',
          borderRadius: 10,
          cursor: 'pointer',
          fontFamily: 'monospace',
          fontSize: 13,
          zIndex: 100,
          backdropFilter: 'blur(10px)',
          display: 'flex',
          alignItems: 'center',
          gap: 8
        }}
      >
        <Compass size={15} /> Navigation
      </button>

      {open && (
        <div className="nav-panel-popup" style={{
          position: 'absolute',
          bottom: 80,
          left: 30,
          width: 280,
          background: 'rgba(10,12,16,0.95)',
          border: '1px solid #1e2535',
          borderRadius: 16,
          fontFamily: 'monospace',
          zIndex: 100,
          backdropFilter: 'blur(12px)'
        }}>

          {/* Header */}
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '14px 16px',
            color: '#e2e8f0',
            fontWeight: 700,
            fontSize: 14,
            borderBottom: '1px solid #1e2535'
          }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Compass size={15} /> Find Route
            </span>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'none',
                border: 'none',
                color: '#64748b',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Body */}
          <div style={{
            padding: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12
          }}>

            {/* FROM */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{
                color: '#64748b',
                fontSize: 10,
                letterSpacing: '.1em',
                textTransform: 'uppercase'
              }}>
                FROM
              </label>
              <select
                value={navOrigin || ''}
                onChange={e => setNavOrigin(e.target.value)}
                style={{
                  background: '#0f1219',
                  border: '1px solid #c1c1c2',
                  color: '#e2e8f0',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace'
                }}
              >
                <option value="">Select start point</option>
                {navGraph && navGraph.nodes
                .filter(n => n.type !== 'POINT')
                .map(n => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>

            {/* TO */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{
                color: '#64748b',
                fontSize: 10,
                letterSpacing: '.1em',
                textTransform: 'uppercase'
              }}>
                TO
              </label>
              <select
                value={navDestination || ''}
                onChange={e => setNavDest(e.target.value)}
                style={{
                  background: '#0f1219',
                  border: '1px solid #cacccf',
                  color: '#e2e8f0',
                  padding: '8px 10px',
                  borderRadius: 8,
                  fontSize: 12,
                  fontFamily: 'monospace'
                }}
              >
                <option value="">Select destination</option>
                {navGraph && navGraph.nodes
                .filter(n => n.type !== 'POINT')
                .map(n => (
                  <option key={n.id} value={n.id}>
                    {n.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Find Route Button */}
            <button
              onClick={handleNavigate}
              disabled={!navOrigin || !navDestination}
              style={{
                background: 'rgb(13, 244, 244)',
                border: '1px solid rgb(152, 211, 217)',
                color: '#000000',
                padding: 10,
                borderRadius: 8,
                cursor: 'pointer',
                fontSize: 13,
                fontFamily: 'monospace',
                fontWeight: 700,
                opacity: (!navOrigin || !navDestination) ? 0.4 : 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 6
              }}
            >
              Find Route <ArrowRight size={14} />
            </button>

            {/* Clear Button */}
            {isNavigating && (
              <button
                onClick={clearNav}
                style={{
                  background: 'rgba(244,63,94,.1)',
                  border: '1px solid rgba(244,63,94,.3)',
                  color: '#f43f5e',
                  padding: 8,
                  borderRadius: 8,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontFamily: 'monospace',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6
                }}
              >
                <X size={13} /> Clear Route
              </button>
            )}

          </div>
        </div>
      )}
    </>
  )
}
