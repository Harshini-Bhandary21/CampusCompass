import { Globe, Gamepad2 } from 'lucide-react'
import { glass, colors, radius } from '../utils/glass'
import useCampusStore from '../store/useCampusStore'

export default function ModeSelector() {

  const controlMode    = useCampusStore(s => s.controlMode)
  const setControlMode = useCampusStore(s => s.setControlMode)
  const isExplore      = controlMode === 'EXPLORE'

  return (
    <div style={{
      ...glass,
      borderRadius: radius.full,
      display:      'flex',
      overflow:     'hidden',
      padding:      3,
      gap:          3,
      zIndex:       200,
    }}>
      <ModeBtn
        active={!isExplore}
        onClick={() => setControlMode('ORBIT')}
        Icon={Globe}
        label="Orbit"
      />
      <ModeBtn
        active={isExplore}
        onClick={() => setControlMode('EXPLORE')}
        Icon={Gamepad2}
        label="Explore"
      />
    </div>
  )
}

function ModeBtn({ active, onClick, Icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display:        'flex',
        alignItems:     'center',
        gap:            6,
        padding:        '8px 16px',
        borderRadius:   radius.full,
        background:     active ? 'rgba(0,229,255,0.12)' : 'transparent',
        border:         active
          ? '1px solid rgba(0,229,255,0.25)'
          : '1px solid transparent',
        color:          active ? colors.cyan : colors.muted,
        fontSize:       12,
        fontWeight:     active ? 600 : 400,
        cursor:         'pointer',
        transition:     'all 0.2s ease',
        boxShadow:      active ? '0 0 12px rgba(0,229,255,0.15)' : 'none',
        whiteSpace:     'nowrap',
      }}
    >
      <Icon size={13} />
      <span>{label}</span>
    </button>
  )
}
