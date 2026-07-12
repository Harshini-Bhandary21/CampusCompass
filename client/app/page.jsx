import HomeContent from './components/landing/HomeContent'

export const metadata = {
  alternates: { canonical: '/' },
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: 'CampusCompass',
  description:
    'CampusCompass automates university timetable generation for FY and department scheduling using constraint-based optimization aligned with NEP 2020.',
  url: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
}

export default function Home() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <HomeContent />
    </>
  )
}
