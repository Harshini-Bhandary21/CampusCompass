"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import { Club } from "@/lib/types";
import { getFallbackGradient, generateFallbackSVG, getClubImage } from "@/lib/imageMap";
import { cn } from "@/lib/utils";

interface ClubCardProps {
  club: Club;
  index: number;
}

// Icon mapper to dynamically render Lucide icons
function ClubIcon({ iconName, className }: { iconName: string; className?: string }) {
  let resolvedIconName = iconName;
  if (iconName === "Theater") resolvedIconName = "Drama";
  if (iconName === "Music2") resolvedIconName = "Music";
  if (iconName === "Globe2") resolvedIconName = "Globe";
  if (iconName === "HandHeart") resolvedIconName = "Heart";

  const IconComponent = (Icons as any)[resolvedIconName] || Icons.Compass;
  return <IconComponent className={className} />;
}

export default function ClubCard({ club, index }: ClubCardProps) {
  const gradientClass = getFallbackGradient(club.category);
  const fallbackSVG = generateFallbackSVG(club.name, club.category);
  
  // Use state to handle loading real images with fallback support
  const [imgSrc, setImgSrc] = useState(() => {
    return getClubImage(club.id) || fallbackSVG;
  });
  const [hasError, setHasError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden glass-card h-full flex flex-col"
    >
      {/* Background card accent glow */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-blue-500/5 pointer-events-none" />

      {/* Cover Image with gradient overlay */}
      <div className="relative h-48 w-full overflow-hidden bg-white shrink-0 p-6 flex items-center justify-center border-b border-slate-100">
        <div className={cn(
          "absolute inset-0 bg-gradient-to-tr opacity-25 group-hover:scale-105 transition-transform duration-700",
          gradientClass
        )} />
        {/* Render fallback SVG */}
        <img
          src={imgSrc}
          onError={hasError ? undefined : () => {
            setHasError(true);
            setImgSrc(fallbackSVG);
          }}
          alt={club.name}
          className="max-w-full max-h-full object-contain group-hover:scale-105 transition-transform duration-500 pointer-events-none relative z-10"
        />

        {/* Category Badge */}
        <span className="absolute top-4 left-4 px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full bg-white/90 backdrop-blur-md border border-slate-200 text-slate-800 flex items-center gap-1.5 shadow-sm">
          <span className={cn(
            "w-1.5 h-1.5 rounded-full animate-pulse",
            club.category === "technical" && "bg-cyan-600",
            club.category === "cultural" && "bg-purple-600",
            club.category === "recreational" && "bg-emerald-600"
          )} />
          {club.category}
        </span>
      </div>

      {/* Card Body */}
      <div className="p-6 flex-grow flex flex-col justify-between relative">
        <div>
          {/* Header & Icon */}
          <div className="flex justify-between items-start gap-4 mb-3">
            <h3 className="text-slate-900 font-display font-bold text-xl leading-tight group-hover:text-blue-600 transition-colors">
              {club.name}
            </h3>
            <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 shrink-0 group-hover:bg-blue-600/10 group-hover:border-blue-500/20 transition-all">
              <ClubIcon iconName={club.icon} className="w-5 h-5" />
            </div>
          </div>

          <p className="text-sm text-slate-600 font-medium line-clamp-3 mb-6 leading-relaxed">
            {club.shortDescription}
          </p>
        </div>

        {/* Card Footer Info */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 text-xs text-slate-500 font-semibold">
          <span>Est. {club.established}</span>
          <Link
            href={`/clubs/${club.slug}`}
            className="text-slate-600 font-bold group-hover:text-blue-700 transition-colors flex items-center gap-1"
          >
            Explore
            <Icons.ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}
