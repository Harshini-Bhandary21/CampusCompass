// Self-contained fallback avatar for people without a profilePhoto — an
// inline SVG data URI (no network request, no extra asset file). Uses
// btoa/encodeURIComponent instead of Buffer so it works in both client
// components (browser) and server components/API routes (Node).
export function initialsAvatarDataUri(name) {
  const initial = (name || '?').trim().charAt(0).toUpperCase() || '?'
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200">
    <rect width="200" height="200" fill="#3c6e71"/>
    <text x="50%" y="53%" font-family="Arial, sans-serif" font-size="80" fill="#ffffff" text-anchor="middle" dominant-baseline="middle">${initial}</text>
  </svg>`
  const base64 = typeof window === 'undefined'
    ? Buffer.from(svg).toString('base64')
    : btoa(unescape(encodeURIComponent(svg)))
  return `data:image/svg+xml;base64,${base64}`
}
