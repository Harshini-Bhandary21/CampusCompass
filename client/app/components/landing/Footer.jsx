import Link from 'next/link'

const PRODUCT_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/#how-it-works', label: 'How It Works' },
  { href: '/#faculty', label: 'Faculty' },
  { href: '/#demo', label: 'Demo' },
]

const RESOURCE_LINKS = [
  { href: '/student/facultyinfo', label: 'Faculty Directory' },
  { href: '/videos', label: 'Video Gallery' },
  { href: '/auth/signin', label: 'Sign In' },
]

export default function Footer() {
  return (
    <footer className="border-t border-slate-100 bg-white">
      <div className="max-w-[1600px] mx-auto px-6 md:px-12 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          <div className="lg:col-span-2 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500" />
              <span className="font-display font-bold text-lg text-slate-900">CampusCompass</span>
            </div>
            <p className="mt-4 text-sm text-slate-600 leading-relaxed">
              Automated, conflict-free university timetable generation for FY and department
              scheduling, built for MIT Academy of Engineering and aligned with NEP 2020.
            </p>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Product</h4>
            <ul className="mt-4 space-y-3">
              {PRODUCT_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">Resources</h4>
            <ul className="mt-4 space-y-3">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sm text-slate-600 hover:text-slate-900 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-14 pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500">
          <p>&copy; {new Date().getFullYear()} CampusCompass &middot; MIT Academy of Engineering, Alandi, Pune</p>
          <p>Built by Team Eklavya_01</p>
        </div>
      </div>
    </footer>
  )
}
