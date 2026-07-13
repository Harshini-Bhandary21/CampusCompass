import { useState } from 'react'
import {
  X, ChevronDown, ChevronUp,
  Building2, DoorOpen, User,
  BookOpen, Mail, Users, Layers
} from 'lucide-react'
import { glass, glassStrong, colors, radius } from '../utils/glass'
import useCampusStore from '../store/useCampusStore'

export default function InfoPanel() {

  const showInfoPanel    = useCampusStore(s => s.showInfoPanel)
  const closePanel       = useCampusStore(s => s.closePanel)
  const selectedBuilding = useCampusStore(s => s.selectedBuilding)
  const selectedRoom     = useCampusStore(s => s.selectedRoom)
  const selectedFaculty  = useCampusStore(s => s.selectedFaculty)
  const faculty          = useCampusStore(s => s.faculty)

  const [minimized, setMinimized] = useState(false)

  if (!showInfoPanel) return null

  const roomFaculty    = selectedRoom?.facultyId
    ? faculty.find(f => f.id === selectedRoom.facultyId)
    : null
  const displayFaculty = roomFaculty || selectedFaculty
  const isRoom         = !!selectedRoom
  const title          = selectedRoom?.roomNumber || selectedBuilding?.name || '—'
  const sub            = selectedRoom?.type       || selectedBuilding?.type || ''

  return (
    <div style={{
      ...glassStrong,
      position:     'absolute',
      top:          'calc(72px + env(safe-area-inset-top))',
      left:         'calc(16px + env(safe-area-inset-left))',
      width:        'min(280px, calc(100vw - 32px))',
      borderRadius: radius.xl,
      overflow:     'hidden',
      zIndex:       100,
      transition:   'all 0.25s ease',
    }}>

      {/* Header */}
      <div style={{
        display:        'flex',
        alignItems:     'center',
        gap:            10,
        padding:        '14px 14px 12px',
      }}>
        <div style={{
          width:          36,
          height:         36,
          borderRadius:   radius.md,
          background:     'rgba(0,229,255,0.08)',
          border:         '1px solid rgba(0,229,255,0.15)',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          flexShrink:     0,
        }}>
          {isRoom
            ? <DoorOpen  size={16} color={colors.cyan} />
            : <Building2 size={16} color={colors.cyan} />
          }
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            color:        colors.text,
            fontWeight:   700,
            fontSize:     14,
            whiteSpace:   'nowrap',
            overflow:     'hidden',
            textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
          {!minimized && (
            <div style={{ color: colors.cyan, fontSize: 10, marginTop: 1, opacity: 0.8 }}>
              {sub}
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 4 }}>
          <IconBtn onClick={() => setMinimized(!minimized)}>
            {minimized
              ? <ChevronDown size={13} color={colors.muted} />
              : <ChevronUp   size={13} color={colors.muted} />
            }
          </IconBtn>
          <IconBtn onClick={closePanel}>
            <X size={13} color={colors.muted} />
          </IconBtn>
        </div>
      </div>

      {/* Body */}
      {!minimized && (
        <>
          <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>

          {selectedBuilding && !selectedRoom && (
            <div style={{ padding: '12px 14px' }}>
              <InfoRow icon={<Layers size={11}/>} label="Type"    value={selectedBuilding.type} />
              <InfoRow icon={<Building2 size={11}/>} label="Floors" value={`${selectedBuilding.floors} Floors`} />
              <InfoRow
                icon={<DoorOpen size={11}/>}
                label="Info"
                value={selectedBuilding.description}
              />
            </div>
          )}

          {selectedRoom && (
            <div style={{ padding: '12px 14px' }}>
              <InfoRow icon={<DoorOpen size={11}/>}  label="Room"     value={selectedRoom.roomNumber} />
              <InfoRow icon={<Layers size={11}/>}    label="Type"     value={selectedRoom.type} />
              <InfoRow icon={<Building2 size={11}/>} label="Floor"    value={`Floor ${selectedRoom.floor}`} />
              <InfoRow icon={<Users size={11}/>}     label="Capacity" value={`${selectedRoom.capacity} persons`} />
              {selectedRoom.amenities?.length > 0 && (
                <InfoRow
                  icon={<BookOpen size={11}/>}
                  label="Amenities"
                  value={selectedRoom.amenities.join(', ')}
                />
              )}
            </div>
          )}

          {displayFaculty && (
            <>
              <div style={{ height: 1, background: 'rgba(255,255,255,0.05)' }}/>
              <div style={{ padding: '12px 14px', display: 'flex', gap: 12 }}>
                <div style={{
                  width:          44,
                  height:         44,
                  borderRadius:   radius.lg,
                  background:     'rgba(0,229,255,0.07)',
                  border:         '1px solid rgba(0,229,255,0.12)',
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  flexShrink:     0,
                }}>
                  <User size={20} color={colors.cyan} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ color: colors.text, fontWeight: 700, fontSize: 13 }}>
                    {displayFaculty.name}
                  </div>
                  <div style={{ color: colors.cyan, fontSize: 10, marginTop: 2, opacity: 0.85 }}>
                    {displayFaculty.designation}
                  </div>
                  <div style={{ color: colors.muted, fontSize: 10, marginTop: 1 }}>
                    {displayFaculty.department}
                  </div>
                  {displayFaculty.email && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 6 }}>
                      <Mail size={9} color={colors.muted}/>
                      <span style={{ color: colors.muted, fontSize: 9 }}>
                        {displayFaculty.email}
                      </span>
                    </div>
                  )}
                  {displayFaculty.subjects?.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 8 }}>
                      {displayFaculty.subjects.map(s => (
                        <span key={s} style={{
                          background:   'rgba(0,229,255,0.07)',
                          border:       '1px solid rgba(0,229,255,0.12)',
                          color:        colors.cyan,
                          fontSize:     9,
                          padding:      '3px 7px',
                          borderRadius: 4,
                        }}>
                          {s}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ marginBottom: 10, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      <div style={{
        marginTop:      2,
        color:          colors.muted,
        flexShrink:     0,
      }}>
        {icon}
      </div>
      <div>
        <div style={{
          color:         colors.muted,
          fontSize:      9,
          letterSpacing: '.1em',
          textTransform: 'uppercase',
          marginBottom:  2,
        }}>
          {label}
        </div>
        <div style={{ color: colors.text, fontSize: 12, lineHeight: 1.4 }}>
          {value}
        </div>
      </div>
    </div>
  )
}

function IconBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        width:          28,
        height:         28,
        borderRadius:   radius.sm,
        background:     'rgba(255,255,255,0.04)',
        border:         '1px solid rgba(255,255,255,0.06)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        cursor:         'pointer',
        transition:     'all 0.15s',
        padding:        0,
        flexShrink:     0,
      }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.08)'}
      onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
    >
      {children}
    </button>
  )
}
