"use client";

import { motion } from "framer-motion";

export default function FloatingBlobs() {
  return (
    <div className="fixed inset-0 -z-50 overflow-hidden pointer-events-none">
      {/* Background radial gradient overlay */}
      <div className="absolute inset-0 bg-[#f6f8fc]" />
      <div className="absolute inset-0 bg-radial-glow opacity-60" />

      {/* Blob 1 - Soft Purple */}
      <motion.div
        className="absolute top-[10%] left-[5%] w-[35vw] h-[35vw] rounded-full bg-purple-400/15 blur-[100px]"
        animate={{
          x: [0, 40, -20, 0],
          y: [0, -40, 30, 0],
          scale: [1, 1.1, 0.9, 1],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 2 - Soft Cyan */}
      <motion.div
        className="absolute top-[40%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-cyan-400/15 blur-[120px]"
        animate={{
          x: [0, -50, 30, 0],
          y: [0, 50, -40, 0],
          scale: [1, 0.9, 1.1, 1],
        }}
        transition={{
          duration: 18,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Blob 3 - Soft Pink */}
      <motion.div
        className="absolute bottom-[10%] left-[20%] w-[30vw] h-[30vw] rounded-full bg-pink-400/10 blur-[100px]"
        animate={{
          x: [0, 30, -30, 0],
          y: [0, 30, -30, 0],
          scale: [1, 1.2, 0.8, 1],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}
