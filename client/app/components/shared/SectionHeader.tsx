"use client";

import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface SectionHeaderProps {
  badge?: string;
  title: string;
  subtitle?: string;
  align?: "left" | "center";
  className?: string;
  theme?: "blue" | "cyan" | "multicolor";
}

export default function SectionHeader({
  badge,
  title,
  subtitle,
  align = "center",
  className,
  theme = "blue",
}: SectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col mb-12 md:mb-16",
        align === "center" ? "items-center text-center" : "items-start text-left",
        className
      )}
    >
      {badge && (
        <motion.span
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="px-3.5 py-1 text-[10px] font-extrabold tracking-widest uppercase rounded-full bg-blue-500/10 border border-slate-500/20 text-black-300 mb-4"
        >
          {badge}
        </motion.span>
      )}

      <motion.h2
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={cn(
          "font-display font-extrabold text-3xl md:text-5xl tracking-tight mb-4",
          theme === "blue" && "text-gradient-blue",
          theme === "cyan" && "text-gradient-cyan",
          theme === "multicolor" && "text-gradient-multicolor"
        )}
      >
        {title}
      </motion.h2>

      {subtitle && (
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="max-w-2xl text-sm md:text-base text-slate-600 leading-relaxed font-sans"
        >
          {subtitle}
        </motion.p>
      )}
    </div>
  );
}
