"use client";

import Link from "next/link";
import { Mail, Phone, MapPin, ExternalLink, Heart } from "lucide-react";
import contactData from "@/data/contact.json";

// Custom premium SVG brand icons to avoid version conflicts in lucide-react
function SocialIcon({ platform, className }: { platform: string; className?: string }) {
  switch (platform) {
    case "facebook":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M22 12c0-5.52-4.48-10-10-10S2 6.48 2 12c0 4.84 3.44 8.87 8 9.8V15H8v-3h2V9.5C10 7.57 11.57 6 13.5 6H16v3h-2c-.55 0-1 .45-1 1v2h3v3h-3v6.95c4.56-.93 8-4.96 8-9.75z" />
        </svg>
      );
    case "twitter":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case "instagram":
      return (
        <svg className={className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
          <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
        </svg>
      );
    case "linkedin":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.779-1.75-1.75s.784-1.75 1.75-1.75 1.75.779 1.75 1.75-.784 1.75-1.75 1.75zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
        </svg>
      );
    case "youtube":
      return (
        <svg className={className} fill="currentColor" viewBox="0 0 24 24">
          <path d="M23.498 6.163a3.003 3.003 0 0 0-2.11-2.11C19.517 3.545 12 3.545 12 3.545s-7.517 0-9.388.508a3.003 3.003 0 0 0-2.11 2.11C0 8.033 0 12 0 12s0 3.967.502 5.837a3.003 3.003 0 0 0 2.11 2.11c1.871.508 9.388.508 9.388.508s7.517 0 9.388-.508a3.003 3.003 0 0 0 2.11-2.11C24 15.967 24 12 24 12s0-3.967-.502-5.837zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    default:
      return <ExternalLink className={className} />;
  }
}

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative bg-white border-t border-slate-200 pt-16 pb-8 overflow-hidden">
      {/* Background soft glow */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[60%] h-[150px] bg-purple-500/5 rounded-full blur-[80px] -z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 md:px-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 pb-12 border-b border-slate-200">
          {/* Brand Col */}
          <div className="flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex items-center">
                <span className="text-[#0f2a4a] font-display font-black text-2xl tracking-tighter">
                  MIT
                </span>
                <div className="h-6 w-px bg-slate-300 mx-2.5" />
                <div className="flex flex-col">
                  <span className="text-[#0f2a4a] font-display font-bold text-[10px] uppercase leading-none tracking-wider">
                    Academy of
                  </span>
                  <span className="text-[#0f2a4a] font-display font-bold text-[10px] uppercase leading-none tracking-wider mt-0.5">
                    Engineering
                  </span>
                </div>
              </div>
            </Link>
            <p className="text-sm text-slate-600 mt-2 leading-relaxed font-medium">
              Fostering an inclusive, dynamic environment for physical, emotional, technical, and ethical development.
            </p>
            {/* Social handles */}
            <div className="flex items-center gap-3 mt-4">
              {Object.entries(contactData.social).map(([platform, url]) => {
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:text-white hover:bg-purple-600 hover:scale-110 transition-all duration-300"
                    aria-label={`Visit our ${platform}`}
                  >
                    <SocialIcon platform={platform} className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-slate-900 font-display font-bold text-base mb-6">Quick Links</h3>
            <ul className="flex flex-col gap-3">
              {[
                { label: "About Clubs Portal", href: "/" },
                { label: "Browse All Clubs", href: "/clubs" },
                { label: "Upcoming & Past Events", href: "/events" },
                { label: "Moments Gallery", href: "/gallery" },
                { label: "Achievements Board", href: "/achievements" },
                { label: "Coordinators Team", href: "/team" },
              ].map((link) => (
                <li key={link.label}>
                  <Link
                    href={link.href}
                    className="text-sm text-slate-600 hover:text-blue-600 font-medium transition-colors flex items-center gap-1 group"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="text-slate-900 font-display font-bold text-base mb-6">Contact Us</h3>
            <ul className="flex flex-col gap-4">
              <li className="flex gap-3 text-sm text-slate-600 font-medium leading-relaxed">
                <MapPin className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                <span>{contactData.address}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Phone className="w-4 h-4 text-blue-600 shrink-0" />
                <span>{contactData.phones[0]}</span>
              </li>
              <li className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                <Mail className="w-4 h-4 text-blue-600 shrink-0" />
                <a href={`mailto:${contactData.email}`} className="hover:text-purple-600 transition-colors">
                  {contactData.email}
                </a>
              </li>
            </ul>
          </div>

          {/* External Portals */}
          <div>
            <h3 className="text-slate-900 font-display font-bold text-base mb-6">College Info</h3>
            <p className="text-sm text-slate-600 font-medium mb-4 leading-relaxed">
              Visit our primary college portal for academic syllabus, admissions, departments, and other campus facilities.
            </p>
            <a
              href={contactData.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-500/5 border border-blue-500/20 text-blue-700 text-sm font-semibold hover:bg-blue-600 hover:text-white transition-all duration-300"
            >
              {/* <span>Main Website</span> */}
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="flex flex-col md:flex-row justify-between items-center pt-8 text-xs text-slate-500 font-medium gap-4">
          <p>© {currentYear} {contactData.institution}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Redesigned & Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500 animate-pulse" /> for MITAOE Campus
          </p>
        </div>
      </div>
    </footer>
  );
}
