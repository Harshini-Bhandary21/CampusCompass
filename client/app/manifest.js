export default function manifest() {
  return {
    name: 'CampusCompass — Automated University Timetable Generator',
    short_name: 'CampusCompass',
    description:
      'CampusCompass automates university timetable generation for FY and department scheduling using constraint-based optimization aligned with NEP 2020.',
    start_url: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#14b8a6',
    icons: [
      {
        src: '/favicon.svg',
        sizes: 'any',
        type: 'image/svg+xml',
      },
      {
        src: '/favicon.ico',
        sizes: '48x48',
        type: 'image/x-icon',
      },
    ],
  }
}
