// Shared glass styles — managed in one place
export const glass = {
  background:           'rgba(8, 12, 22, 0.72)',
  backdropFilter:       'blur(24px) saturate(160%)',
  WebkitBackdropFilter: 'blur(24px) saturate(160%)',
  border:               '1px solid rgba(255,255,255,0.07)',
  boxShadow: `
    0 8px 32px rgba(0,0,0,0.5),
    inset 0 1px 0 rgba(255,255,255,0.05),
    inset 0 -1px 0 rgba(0,0,0,0.2)
  `,
}

export const glassStrong = {
  background:           'rgba(8, 12, 22, 0.88)',
  backdropFilter:       'blur(32px) saturate(180%)',
  WebkitBackdropFilter: 'blur(32px) saturate(180%)',
  border:               '1px solid rgba(255,255,255,0.09)',
  boxShadow: `
    0 16px 48px rgba(0,0,0,0.6),
    inset 0 1px 0 rgba(255,255,255,0.06)
  `,
}

export const colors = {
  cyan:    '#00e5ff',
  purple:  '#7c3aed',
  amber:   '#f59e0b',
  red:     '#f43f5e',
  green:   '#10b981',
  muted:   '#64748b',
  text:    '#e2e8f0',
  subtext: '#94a3b8',
}

export const radius = {
  sm:  8,
  md:  12,
  lg:  16,
  xl:  20,
  full: 999,
}
