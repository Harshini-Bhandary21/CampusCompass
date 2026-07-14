"use client";

import { useEffect, useState } from 'react';
import ColorBends from './ColorBends';
import DotField from './DotField';

// The dot-field/color-bends layers render to <canvas>/WebGL, which can't
// consume CSS classes, so the literal color values live in tokens.css as
// custom properties and get resolved here at mount instead of being
// hardcoded as prop defaults.
function useBackgroundColors() {
  const [colors, setColors] = useState(null);

  useEffect(() => {
    const style = getComputedStyle(document.documentElement);
    setColors({
      blobFrom: style.getPropertyValue('--bg-blob-from').trim() || '#3a3e43',
      blobTo: style.getPropertyValue('--bg-blob-to').trim() || '#ececf6',
      glow: style.getPropertyValue('--bg-glow-color').trim() || 'transparent',
      dot: style.getPropertyValue('--bg-dot-color').trim() || '#feffff',
    });
  }, []);

  return colors;
}

export default function DashboardBackground() {
  const colors = useBackgroundColors();
  if (!colors) return null;

  return (
    <div className="fixed inset-0 z-[-1] pointer-events-none bg-white overflow-hidden">
      {/* Interactive Dot Field Pattern */}
      <div className="absolute inset-0 opacity-[0.8] pointer-events-auto">
        <DotField
          dotRadius={1.2}
          dotSpacing={6}
          cursorRadius={150}
          cursorForce={0.45}
          bulgeOnly
          bulgeStrength={39}
          glowRadius={50}
          sparkle={false}
          waveAmplitude={0}
          gradientFrom={colors.blobFrom}
          gradientTo={colors.blobTo}
          glowColor={colors.glow}
        />
      </div>

      {/* Color Bends Animated Background */}
      <div className="absolute inset-0 opacity-30 mix-blend-multiply">
        <ColorBends
          color={colors.dot}
          speed={0.2}
          frequency={1.0}
          noise={0.15}
          bandWidth={0.14}
          rotation={90}
          fadeTop={0.75}
          iterations={1}
          intensity={1.3}
        />
      </div>
    </div>
  );
}
