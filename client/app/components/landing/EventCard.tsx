"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Calendar, Tag, ChevronRight } from "lucide-react";
import { Event } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { generateFallbackSVG } from "@/lib/imageMap";
import { cn } from "@/lib/utils";

interface EventCardProps {
  event: Event;
  index: number;
}

export default function EventCard({ event, index }: EventCardProps) {
  const fallbackSVG = generateFallbackSVG(event.title, event.category);
  const [imgSrc, setImgSrc] = useState(event.image || fallbackSVG);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(event.image || fallbackSVG);
    setHasError(false);
  }, [event.image, fallbackSVG]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: index * 0.05 }}
      className="group relative rounded-2xl overflow-hidden glass-card h-full flex flex-col md:flex-row"
    >
      {/* Event Cover Image */}
      <div className="relative w-full md:w-64 h-48 md:h-auto overflow-hidden bg-slate-100 shrink-0">
        <img
          src={imgSrc}
          onError={hasError ? undefined : () => {
            setHasError(true);
            setImgSrc(fallbackSVG);
          }}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
        />
        <div className="absolute inset-0 bg-gradient-to-t md:bg-gradient-to-r from-white via-white/30 to-transparent" />
        
        {/* Status Badge */}
        <span className={cn(
          "absolute top-4 left-4 px-3 py-1 text-[10px] font-extrabold tracking-wider uppercase rounded-full border flex items-center gap-1.5 shadow-sm",
          event.status === "upcoming" 
            ? "bg-blue-50 border-blue-200 text-blue-700" 
            : "bg-slate-100 border-slate-200 text-slate-600"
        )}>
          <span className={cn(
            "w-1.5 h-1.5 rounded-full",
            event.status === "upcoming" ? "bg-slate-600 animate-pulse" : "bg-slate-400"
          )} />
          {event.status}
        </span>
      </div>

      {/* Content */}
      <div className="p-6 md:p-8 flex-grow flex flex-col justify-between">
        <div>
          {/* Metadata line */}
          <div className="flex flex-wrap items-center gap-y-2 gap-x-4 text-xs text-slate-500 font-semibold mb-3">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              {formatDate(event.date)}
            </span>
            <span className="flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-cyan-600" />
              Club: <span className="text-slate-700 font-bold">{event.clubName}</span>
            </span>
          </div>

          <h3 className="text-slate-900 font-display font-bold text-xl mb-3 group-hover:text-blue-600 transition-colors">
            {event.title}
          </h3>

          <p className="text-sm text-slate-600 font-medium leading-relaxed mb-4">
            {event.description}
          </p>
        </div>

        {/* Action / Category indicator */}
        <div className="flex items-center justify-between pt-4 border-t border-slate-200 mt-4">
          <span className="text-[10px] font-extrabold tracking-wider uppercase text-slate-500">
            Category: {event.category}
          </span>
          <span className="text-blue-600 text-xs font-bold flex items-center gap-1 group-hover:text-blue-700">
            Read Event Details
            <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
          </span>
        </div>
      </div>
    </motion.div>
  );
}
