"use client";

import { useState, useEffect } from "react";

interface FallbackImageProps {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}

export default function FallbackImage({
  src,
  fallbackSrc,
  alt,
  className,
}: FallbackImageProps) {
  const [imgSrc, setImgSrc] = useState(src || fallbackSrc);
  const [hasError, setHasError] = useState(false);

  // Sync state if source changes
  useEffect(() => {
    setImgSrc(src || fallbackSrc);
    setHasError(false);
  }, [src, fallbackSrc]);

  const handleError = () => {
    if (!hasError) {
      setHasError(true);
      setImgSrc(fallbackSrc);
    }
  };

  return (
    <img
      src={imgSrc}
      onError={hasError ? undefined : handleError}
      alt={alt}
      className={className}
    />
  );
}
