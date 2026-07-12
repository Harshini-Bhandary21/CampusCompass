import facultyData from '@/data/faculty.json'

export default function sitemap() {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  const lastModified = new Date()

  const staticRoutes = ['', '/videos', '/student/dashboard', '/student/facultyinfo'].map((path) => ({
    url: `${siteUrl}${path}`,
    lastModified,
    changeFrequency: path === '' ? 'weekly' : 'monthly',
    priority: path === '' ? 1 : 0.6,
  }))

  const facultyRoutes = facultyData.map((faculty) => ({
    url: `${siteUrl}/student/facultyinfo/${faculty.id}`,
    lastModified,
    changeFrequency: 'monthly',
    priority: 0.4,
  }))

  return [...staticRoutes, ...facultyRoutes]
}
