"use client";

import { useRef, ReactNode } from "react";
import { motion, useScroll, useTransform } from "framer-motion";

interface ParallaxSectionProps {
  children: ReactNode;
  backgroundImage?: string;
  speed?: number; // Speed factor from -1 to 1
  className?: string;
}

export default function ParallaxSection({
  children,
  backgroundImage,
  speed = 0.2,
  className,
}: ParallaxSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });

  // Maps scroll progress from start-to-end to translation Y offsets
  const y = useTransform(scrollYProgress, [0, 1], [`${-speed * 80}px`, `${speed * 80}px`]);

  return (
    <div
      ref={ref}
      className={`relative w-full overflow-hidden ${className || ""}`}
    >
      {/* Background layer */}
      {backgroundImage && (
        <motion.div
          style={{ y }}
          className="absolute inset-0 -z-10 w-full h-[120%] bg-cover bg-center"
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px]" />
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover opacity-45 pointer-events-none"
          />
        </motion.div>
      )}

      {/* Foreground Content */}
      <div className="relative z-10 w-full h-full">
        {children}
      </div>
    </div>
  );
}
