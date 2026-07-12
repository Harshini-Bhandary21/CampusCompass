"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Sparkles, Compass, Calendar, Image, Trophy, Users, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Home", href: "/", icon: Compass },
  { label: "Clubs", href: "/clubs", icon: Sparkles },
  { label: "Events", href: "/events", icon: Calendar },
  { label: "Gallery", href: "/gallery", icon: Image },
  { label: "Achievements", href: "/achievements", icon: Trophy },
  // { label: "Team", href: "/team", icon: Users },
  { label: "Contact", href: "/contact", icon: Phone },
];

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 w-full",
          scrolled ? "glass-nav py-3" : "bg-transparent py-5"
        )}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="flex items-center">
              <span className="text-[#0f2a4a] font-display font-black text-2xl tracking-tighter group-hover:scale-105 transition-transform">
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
              <span className="ml-3 px-2 py-0.5 rounded-md bg-[#0f2a4a]/10 text-[#0f2a4a] font-bold text-[8px] uppercase tracking-widest hidden sm:inline-block">
                Stdent Portal
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_ITEMS.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2",
                    isActive
                      ? "text-blue-900"
                      : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
                  )}
                >
                  <item.icon className="w-4 h-4 opacity-80" />
                  {item.label}
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                    className="absolute inset-0 bg-blue-900/10 border border-blue-900/20 rounded-full -z-10"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                </Link>
              );
            })}
          </nav>

          {/* CTA Link */}
          <div className="hidden lg:flex items-center">

            <Link
  href="/auth/signin"
   className="
    px-5 py-2.5
    rounded-xl
    text-sm font-semibold
    text-white

    bg-gradient-to-r
    from-blue-900/90
    via-blue-800/85
    to-blue-900/90

    backdrop-blur-lg
    border border-blue-300/20

    shadow-lg
    shadow-blue-900/40

    hover:from-blue-800
    hover:via-blue-700
    hover:to-blue-800

    hover:shadow-xl
    hover:shadow-blue-700/40
    hover:scale-105

    transition-all duration-300
  "
>
  Sign In
</Link>
            {/* <Link
              href="/clubs"
              className="px-5 py-2 rounded-full text-xs font-semibold uppercase tracking-wider bg-purple-600 hover:bg-purple-700 text-white shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
            >
              Explore Clubs
            </Link> */}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-black/5 transition-colors focus:outline-none"
            aria-label="Toggle menu"
          >
            {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-40 bg-white/98 backdrop-blur-lg lg:hidden flex flex-col justify-center px-8 md:px-16"
          >
            <nav className="flex flex-col gap-6 text-2xl font-display font-bold">
              {NAV_ITEMS.map((item, index) => {
                const isActive = pathname === item.href;
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Link
                      href={item.href}
                      onClick={() => setIsOpen(false)}
                      className={cn(
                        "flex items-center gap-4 py-2 transition-colors",
                        isActive
                          ? "text-[#0f2a4a] font-extrabold"
                          : "text-slate-600 hover:text-slate-900"
                      )}
                    >
                      <item.icon className="w-6 h-6 text-slate-600" />
                      {item.label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-12 pt-8 border-t border-slate-200 flex flex-col gap-4 text-sm text-slate-500"
            >
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span>Admission Desk: +91-9071123436</span>
              </div>
              <p className="text-xs">MIT Academy of Engineering, Alandi, Pune</p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
