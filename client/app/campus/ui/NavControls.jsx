import { Play, Pause, Square, RotateCcw, Gauge } from 'lucide-react'
import { glass, colors, radius } from '../utils/glass'
import useCampusStore from '../store/useCampusStore'

const SPEED_OPTIONS = [
  { label: '0.5×', value: 0.5 },
  { label: '1×',   value: 1.0 },
  { label: '2×',   value: 2.0 },
  { label: '3×',   value: 3.0 },
]

function speedColor(s) {
  if (s <= 0.5) return colors.muted
  if (s <= 1.0) return colors.cyan
  if (s <= 2.0) return colors.amber
  return colors.red
}

export default function NavControls() {

  const isNavigating   = useCampusStore(s => s.isNavigating)
  const controlMode    = useCampusStore(s => s.controlMode)
  const isFollowing    = useCampusStore(s => s.isFollowingRoute)
  const isFollowPaused = useCampusStore(s => s.isFollowPaused)
  const toggleFollow   = useCampusStore(s => s.toggleFollowRoute)
  const pauseFollow    = useCampusStore(s => s.pauseFollowRoute)
  const restartFollow  = useCampusStore(s => s.restartFollowRoute)
  const followProgress = useCampusStore(s => s.followProgress)
  const followSpeed    = useCampusStore(s => s.followSpeed)
  const setFollowSpeed = useCampusStore(s => s.setFollowSpeed)

  if (!isNavigating || controlMode !== 'EXPLORE') return null

  const pct = Math.round(followProgress * 100)

  return (
    <div className="nav-controls-box" style={{
      ...glass,
      borderRadius: radius.lg,
      padding:      '14px 14px 12px',
      width:        190,
      display:      'flex',
      flexDirection:'column',
      gap:          10,
    }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{
          width:          28,
          height:         28,
          borderRadius:   radius.sm,
          background:     'rgba(0,229,255,0.08)',
          border:         '1px solid rgba(0,229,255,0.15)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
        }}>
          <Gauge size={14} color={colors.cyan} />
        </div>
        <span style={{ flex: 1, color: colors.text, fontSize: 12, fontWeight: 600 }}>
          Follow Route
        </span>
        <span style={{
          color:      pct === 100 ? colors.green : colors.cyan,
          fontSize:   11,
          fontWeight: 700,
          fontFamily: 'monospace',
        }}>
          {pct}%
        </span>
      </div>

      {/* Progress bar */}
      <div style={{
        height:       4,
        background:   'rgba(255,255,255,0.07)',
        borderRadius: radius.full,
        overflow:     'hidden',
      }}>
        <div style={{
          height:     '100%',
          width:      `${pct}%`,
          background: pct === 100
            ? colors.green
            : 'linear-gradient(90deg, #00e5ff, #7c3aed)',
          borderRadius: radius.full,
          transition:   'width 0.25s ease',
          boxShadow:    '0 0 8px rgba(0,229,255,0.4)',
        }}/>
      </div>

      {/* Action buttons */}
      <div style={{ display: 'flex', gap: 6 }}>
        <Btn
          onClick={toggleFollow}
          color={isFollowing ? colors.red : colors.cyan}
          title={isFollowing ? 'Stop' : 'Start'}
          flex={1}
        >
          {isFollowing ? <Square size={14}/> : <Play size={14}/>}
        </Btn>

        <Btn
          onClick={pauseFollow}
          color={colors.amber}
          title={isFollowPaused ? 'Resume' : 'Pause'}
          flex={1}
          disabled={!isFollowing}
        >
          {isFollowPaused ? <Play size={14}/> : <Pause size={14}/>}
        </Btn>

        <Btn
          onClick={restartFollow}
          color="#a78bfa"
          title="Restart"
          flex={1}
        >
          <RotateCcw size={14}/>
        </Btn>
      </div>

      {/* Divider */}
      <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>

      {/* Speed label */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ color: colors.muted, fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase' }}>
          Speed
        </span>
        <span style={{ color: speedColor(followSpeed), fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>
          {followSpeed}×
        </span>
      </div>

      {/* Speed chips */}
      <div style={{ display: 'flex', gap: 4 }}>
        {SPEED_OPTIONS.map(opt => {
          const active = followSpeed === opt.value
          const c      = speedColor(opt.value)
          return (
            <button
              key={opt.value}
              onClick={() => setFollowSpeed(opt.value)}
              style={{
                flex:         1,
                height:       30,
                borderRadius: radius.sm,
                border:       `1px solid ${active ? c + '55' : 'rgba(255,255,255,0.06)'}`,
                background:   active ? c + '18' : 'rgba(255,255,255,0.03)',
                color:        active ? c : colors.muted,
                fontSize:     10,
                fontWeight:   700,
                cursor:       'pointer',
                transition:   'all 0.15s',
                boxShadow:    active ? `0 0 8px ${c}33` : 'none',
                fontFamily:   'monospace',
              }}
            >
              {opt.label}
            </button>
          )
        })}
      </div>

      {/* Fine slider */}
      <input
        type="range"
        min="0.25" max="5" step="0.25"
        value={followSpeed}
        onChange={e => setFollowSpeed(parseFloat(e.target.value))}
        style={{ accentColor: speedColor(followSpeed) }}
      />
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: -4 }}>
        <span style={{ color: colors.muted, fontSize: 9, fontFamily: 'monospace' }}>Slow</span>
        <span style={{ color: colors.muted, fontSize: 9, fontFamily: 'monospace' }}>Fast</span>
      </div>

    </div>
  )
}

function Btn({ children, onClick, color, title, flex, disabled }) {
  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      style={{
        flex,
        height:         38,
        borderRadius:   radius.sm,
        background:     disabled ? 'rgba(255,255,255,0.03)' : `${color}12`,
        border:         `1px solid ${disabled ? 'rgba(255,255,255,0.05)' : color + '30'}`,
        color:          disabled ? colors.muted : color,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         disabled ? 'default' : 'pointer',
        transition:     'all 0.15s',
        boxShadow:      disabled ? 'none' : `0 0 10px ${color}20`,
        opacity:        disabled ? 0.4 : 1,
      }}
      onMouseEnter={e => {
        if (disabled) return
        e.currentTarget.style.background = `${color}22`
        e.currentTarget.style.boxShadow  = `0 0 14px ${color}40`
      }}
      onMouseLeave={e => {
        if (disabled) return
        e.currentTarget.style.background = `${color}12`
        e.currentTarget.style.boxShadow  = `0 0 10px ${color}20`
      }}
    >
      {children}
    </button>
  )
}
