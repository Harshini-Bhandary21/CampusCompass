"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Eye } from "lucide-react";
import { GalleryItem } from "@/lib/types";
import { generateFallbackSVG } from "@/lib/imageMap";
import { cn } from "@/lib/utils";

interface GalleryGridProps {
  items: GalleryItem[];
}

interface GalleryCardProps {
  item: GalleryItem;
  onClick: () => void;
}

function GalleryCard({ item, onClick }: GalleryCardProps) {
  const fallbackSVG = generateFallbackSVG(item.title, item.category);
  const [imgSrc, setImgSrc] = useState(item.image || fallbackSVG);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(item.image || fallbackSVG);
    setHasError(false);
  }, [item.image, fallbackSVG]);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className="group relative h-64 rounded-2xl overflow-hidden glass-card cursor-pointer"
    >
      {/* Image */}
      <img
        src={imgSrc}
        onError={hasError ? undefined : () => {
          setHasError(true);
          setImgSrc(fallbackSVG);
        }}
        alt={item.title}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 pointer-events-none"
      />

      {/* Hover overlay details (Dark gradient overlay for text readability) */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-5">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white mb-3 shadow-md">
          <Eye className="w-4 h-4" />
        </div>
        <span className="text-[10px] font-extrabold tracking-wider uppercase text-blue-400 mb-1">
          {item.category} • {item.club}
        </span>
        <h4 className="text-white font-display font-bold text-sm leading-snug line-clamp-2">
          {item.title}
        </h4>
      </div>

      {/* Category indicator on default view */}
      <div className="absolute bottom-4 left-4 group-hover:opacity-0 transition-opacity duration-300 flex items-center gap-2">
        <span className={cn(
          "w-2.5 h-2.5 rounded-full border border-white/80",
          item.category === "technical" && "bg-cyan-600",
          item.category === "cultural" && "bg-purple-600",
          item.category === "recreational" && "bg-emerald-600"
        )} />
        <span className="text-[10px] text-slate-800 font-bold bg-white/90 border border-slate-200/80 px-2 py-0.5 rounded backdrop-blur-sm shadow-sm">
          {item.title.split(" - ")[0]}
        </span>
      </div>
    </motion.div>
  );
}

function LightboxImage({ src, fallbackSrc, alt }: { src: string; fallbackSrc: string; alt: string }) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  return (
    <img
      src={imgSrc}
      onError={hasError ? undefined : () => {
        setHasError(true);
        setImgSrc(fallbackSrc);
      }}
      alt={alt}
      className="max-h-[70vh] w-auto object-contain pointer-events-none"
    />
  );
}

const CATEGORIES = ["all", "technical", "cultural", "recreational"];

export default function GalleryGrid({ items }: GalleryGridProps) {
  const [activeFilter, setActiveFilter] = useState("all");
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const filteredItems = activeFilter === "all"
    ? items
    : items.filter(item => item.category.toLowerCase() === activeFilter.toLowerCase());

  return (
    <div className="flex flex-col items-center gap-12 w-full">
      {/* Filters */}
      <div className="flex flex-wrap items-center justify-center gap-2 bg-slate-100 p-1.5 rounded-full border border-slate-200 backdrop-blur-md">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            onClick={() => setActiveFilter(category)}
            className={cn(
              "px-5 py-2 rounded-full text-xs font-bold uppercase tracking-wider transition-all duration-300",
              activeFilter === category
                ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                : "text-slate-600 hover:text-slate-900 hover:bg-black/5"
            )}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid Layout */}
      <motion.div
        layout
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full"
      >
        <AnimatePresence mode="popLayout">
          {filteredItems.map((item) => (
            <GalleryCard
              key={item.id}
              item={item}
              onClick={() => setSelectedImage(item)}
            />
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty State */}
      {filteredItems.length === 0 && (
        <div className="text-center py-20">
          <p className="text-slate-500 font-semibold">No media available in this category.</p>
        </div>
      )}

      {/* Lightbox Modal (Retains standard dark media backdrop for photo viewing) */}
      <AnimatePresence>
        {selectedImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedImage(null)}
            className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4 md:p-8"
          >
            {/* Close Button */}
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-6 right-6 p-2 rounded-full bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 transition-colors z-50 border border-white/5"
            >
              <X className="w-6 h-6" />
            </button>

            {/* Modal Content */}
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="relative max-w-4xl w-full flex flex-col items-center"
            >
              <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl max-h-[70vh] w-full flex items-center justify-center bg-zinc-950">
                <LightboxImage
                  src={selectedImage.image}
                  fallbackSrc={generateFallbackSVG(selectedImage.title, selectedImage.category)}
                  alt={selectedImage.title}
                />
              </div>

              {/* Title Overlay */}
              <div className="text-center mt-6 max-w-2xl px-4">
                <span className="text-xs font-extrabold tracking-widest uppercase text-purple-400">
                  {selectedImage.category} • Club: {selectedImage.club}
                </span>
                <h3 className="text-white font-display font-extrabold text-lg md:text-2xl mt-2 leading-snug">
                  {selectedImage.title}
                </h3>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
