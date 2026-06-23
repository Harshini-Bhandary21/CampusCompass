"use client";

import { motion } from "framer-motion";
import { Mail, Phone, Building, Star, Award } from "lucide-react";
import { TeamMember } from "@/lib/types";
import { generateFallbackSVG } from "@/lib/imageMap";

interface ProfileCardProps {
  member: TeamMember;
  index: number;
}

export default function ProfileCard({ member, index }: ProfileCardProps) {
  const fallbackSVG = generateFallbackSVG(member.name, member.type === "faculty" ? "technical" : "cultural");

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative rounded-2xl p-6 glass-card text-center flex flex-col items-center justify-between"
    >
      {/* Background soft lighting */}
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-black/5 to-transparent rounded-t-2xl pointer-events-none" />

      {/* Role Badge */}
      <span className="absolute top-4 right-4 px-2 py-0.5 text-[9px] font-extrabold tracking-wider uppercase rounded-full bg-slate-100 border border-slate-200 text-slate-600">
        {member.type}
      </span>

      {/* Profile Image / Fallback Avatar */}
      <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-purple-500/10 group-hover:border-purple-500/35 transition-colors duration-300 mb-5 shrink-0 shadow-md">
        <img
          src={fallbackSVG}
          alt={member.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 pointer-events-none"
        />
      </div>

      {/* Title Details */}
      <div className="mb-6 flex-grow">
        <h3 className="text-slate-900 font-display font-bold text-lg leading-snug group-hover:text-purple-600 transition-colors">
          {member.name}
        </h3>
        
        {/* Role with icon */}
        <p className="text-purple-600 text-xs font-semibold mt-1 mb-2 flex items-center justify-center gap-1.5">
          {member.type === "faculty" ? <Award className="w-3.5 h-3.5" /> : <Star className="w-3.5 h-3.5" />}
          {member.role}
        </p>

        {/* Club Label */}
        <p className="text-[10px] text-slate-500 tracking-wider uppercase font-bold mb-3">
          {member.clubName}
        </p>

        {/* Faculty department if exists */}
        {member.department && (
          <p className="text-xs text-slate-600 font-medium flex items-center justify-center gap-1.5 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200 max-w-[200px] mx-auto">
            <Building className="w-3 h-3 text-cyan-600 shrink-0" />
            <span className="truncate">{member.department}</span>
          </p>
        )}
      </div>

      {/* Contact Trigger Button */}
      <div className="w-full pt-4 border-t border-slate-200 flex items-center justify-center gap-4 shrink-0">
        {member.email ? (
          <a
            href={`mailto:${member.email}`}
            className="w-8 h-8 rounded-full bg-slate-100 hover:bg-purple-600/10 text-slate-600 hover:text-purple-600 border border-slate-200 hover:border-purple-500/20 flex items-center justify-center transition-all duration-300"
            title={`Email ${member.name}`}
          >
            <Mail className="w-4 h-4" />
          </a>
        ) : (
          <span className="text-[10px] text-slate-500 font-bold uppercase italic">No email public</span>
        )}
      </div>
    </motion.div>
  );
}
