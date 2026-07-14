'use client';

import { X } from 'lucide-react';

export default function ImageViewer({ src, alt, onClose }) {
  if (!src) return null;

  return (
    <div
      className="fixed inset-0 z-[10000] flex flex-col items-center justify-center p-8 bg-black/85"
      onClick={onClose}
    >
      <button
        className="absolute top-6 right-6 z-[10001] text-white hover:text-gray-300 transition-colors"
        onClick={onClose}
      >
        <X size={32} />
      </button>
      <img
        src={src}
        alt={alt}
        className="max-w-full max-h-[80vh] object-contain rounded-lg shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
