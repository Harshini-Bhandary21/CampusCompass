import { Inter, Sora } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import SiteChrome from './components/shared/SiteChrome'
import './globals.css'

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
})

const sora = Sora({
  subsets: ['latin'],
  display: 'swap',
  weight: ['600', '700', '800'],
  variable: '--font-display-sora',
})

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: {
    default: 'CampusCompass — Automated University Timetable Generator',
    template: '%s | CampusCompass',
  },
  description:
    'CampusCompass automates university timetable generation for FY and department scheduling using constraint-based optimization aligned with NEP 2020.',
  keywords: [
    'timetable generator',
    'university scheduling',
    'NEP 2020',
    'FY scheduler',
    'department timetable',
    'constraint optimization',
    'academic scheduling',
    'CampusCompass',
  ],
  authors: [{ name: 'CampusCompass' }],
  creator: 'CampusCompass',
  openGraph: {
    title: 'CampusCompass — Automated University Timetable Generator',
    description:
      'Automated, constraint-based timetable generation for universities. FY and department scheduling aligned with NEP 2020.',
    type: 'website',
    siteName: 'CampusCompass',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CampusCompass',
    description: 'Automated university timetable generation aligned with NEP 2020.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
  icons: {
    icon: [{ url: '/favicon.svg', type: 'image/svg+xml' }],
  },
  formatDetection: { telephone: false, email: false, address: false },
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#14b8a6' },
    { media: '(prefers-color-scheme: dark)', color: '#0f172a' },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <SiteChrome>{children}</SiteChrome>
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: { fontSize: '14px' },
            success: { iconTheme: { primary: '#10b981', secondary: 'white' } },
            error: { duration: 6000, iconTheme: { primary: '#ef4444', secondary: 'white' } },
          }}
        />
      </body>
    </html>
  )
}
