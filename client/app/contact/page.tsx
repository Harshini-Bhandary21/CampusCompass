"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import SectionHeader from "@/components/SectionHeader";
import contactData from "@/data/contact.json";
import clubsData from "@/data/clubs.json";
import { Club } from "@/lib/types";

const clubs = clubsData as Club[];

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
      return <Mail className={className} />;
  }
}

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    clubInterest: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate API request
    setTimeout(() => {
      setIsSubmitting(false);
      setSuccessMsg("Thank you! Your inquiry has been sent to the coordinators.");
      setFormData({ name: "", email: "", clubInterest: "", message: "" });
    }, 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-6 md:px-12 py-12 flex flex-col gap-12">
      {/* Header */}
      <SectionHeader
        badge="Contact Us"
        title="Get In Touch"
        subtitle="Have questions about club recruitments, upcoming events, or looking to collaborate? Drop us a line and our coordinators will reach out."
        theme="cyan"
      />

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">
        {/* Info Column (2/5 size) */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="glass-card p-8 rounded-2xl border border-slate-200 flex flex-col gap-6 relative">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-2">Campus Location</h2>

            {/* Address */}
            <div className="flex gap-4 items-start text-sm text-slate-600 font-medium">
              <MapPin className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block mb-1">Office Address</span>
                <span>{contactData.address}</span>
              </div>
            </div>

            {/* Phone numbers */}
            <div className="flex gap-4 items-start text-sm text-slate-600 font-medium">
              <Phone className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block mb-1">Helpline Phones</span>
                <div className="flex flex-col gap-1">
                  {contactData.phones.map((p, i) => (
                    <span key={i}>{p}</span>
                  ))}
                </div>
              </div>
            </div>

            {/* Email */}
            <div className="flex gap-4 items-start text-sm text-slate-600 font-medium">
              <Mail className="w-5 h-5 text-cyan-600 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold text-slate-900 block mb-1">Admissions & Info</span>
                <a href={`mailto:${contactData.email}`} className="hover:text-cyan-600 transition-colors">
                  {contactData.email}
                </a>
              </div>
            </div>
          </div>

          {/* Social connect */}
          <div className="glass-card p-8 rounded-2xl border border-slate-200">
            <h2 className="text-xl font-display font-bold text-slate-900 mb-6">Connect Online</h2>
            <div className="flex flex-wrap gap-4">
              {Object.entries(contactData.social).map(([platform, url]) => {
                return (
                  <a
                    key={platform}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-12 h-12 rounded-xl bg-slate-100 hover:bg-cyan-600 border border-slate-200 hover:scale-105 transition-all duration-300 flex items-center justify-center text-slate-600 hover:text-white"
                    title={`Follow us on ${platform}`}
                  >
                    <SocialIcon platform={platform} className="w-5 h-5" />
                  </a>
                );
              })}
            </div>
          </div>
        </div>

        {/* Form Column (3/5 size) */}
        <div className="lg:col-span-3">
          <form
            onSubmit={handleSubmit}
            className="glass-card p-8 md:p-10 rounded-2xl border border-slate-200 flex flex-col gap-6 relative"
          >
            <h2 className="text-xl font-display font-bold text-slate-900 mb-2">Send Inquiry</h2>

            {/* Success message banner */}
            {successMsg && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 text-sm font-semibold"
              >
                {successMsg}
              </motion.div>
            )}

            {/* Name Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="name" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Full Name
              </label>
              <input
                id="name"
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Your name"
                className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors"
              />
            </div>

            {/* Email Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="email" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="your.email@example.com"
                className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors"
              />
            </div>

            {/* Club interest dropdown */}
            <div className="flex flex-col gap-2">
              <label htmlFor="club" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Select Club of Interest
              </label>
              <select
                id="club"
                value={formData.clubInterest}
                onChange={(e) => setFormData({ ...formData, clubInterest: e.target.value })}
                className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 text-sm focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors"
              >
                <option value="" className="text-slate-400">
                  Select a club (Optional)
                </option>
                {clubs.map((club) => (
                  <option key={club.id} value={club.name} className="text-slate-800">
                    {club.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Message Input */}
            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Message
              </label>
              <textarea
                id="message"
                required
                rows={5}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Type your questions or recruitment inquiry here..."
                className="px-4 py-3 rounded-xl bg-white border border-slate-200 text-slate-800 placeholder-slate-400 text-sm focus:outline-none focus:border-cyan-600 focus:ring-1 focus:ring-cyan-600 transition-colors resize-none"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-sm font-semibold uppercase tracking-wider flex items-center justify-center gap-2 shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <span>Sending...</span>
              ) : (
                <>
                  <span>Send Message</span>
                  <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
