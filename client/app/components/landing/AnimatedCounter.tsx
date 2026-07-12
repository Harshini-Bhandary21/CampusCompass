"use client";

import { useEffect, useState } from "react";
import { useInView } from "react-intersection-observer";

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  suffix?: string;
}

export default function AnimatedCounter({
  value,
  duration = 1.5,
  suffix = "",
}: AnimatedCounterProps) {
  const [count, setCount] = useState(0);
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1,
  });

  useEffect(() => {
    if (!inView) return;

    let startTimestamp: number | null = null;
    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / (duration * 1000), 1);
      
      // Easing function (easeOutQuad)
      const easeProgress = progress * (2 - progress);
      
      setCount(Math.floor(easeProgress * value));

      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setCount(value);
      }
    };

    window.requestAnimationFrame(step);
  }, [value, duration, inView]);

  return (
    <span ref={ref} className="tabular-nums font-bold">
      {count.toLocaleString()}
      {suffix}
    </span>
  );
}
