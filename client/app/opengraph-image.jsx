import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'CampusCompass — Automated University Timetable Generator'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'flex-start',
          padding: '80px',
          background: 'linear-gradient(135deg, #0f172a 0%, #134e4a 60%, #14b8a6 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 16,
            marginBottom: 40,
          }}
        >
          <div
            style={{
              display: 'flex',
              width: 64,
              height: 64,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #14b8a6, #10b981)',
            }}
          />
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, color: '#f0fdfa' }}>
            CampusCompass
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 60,
            fontWeight: 800,
            color: '#ffffff',
            lineHeight: 1.15,
            maxWidth: 980,
          }}
        >
          Automated University Timetable Generation
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 32,
            fontSize: 28,
            color: '#ccfbf1',
            maxWidth: 900,
          }}
        >
          Constraint-based FY & department scheduling, aligned with NEP 2020.
        </div>
      </div>
    ),
    { ...size }
  )
}
