"use client";

import { useEffect, useState } from "react";

const TIPS = [
  "Placing buildings...",
  "Lighting windows...",
  "Paving streets...",
  "Hanging signs...",
  "The Vibe Code City loading...",
];

interface LoadingScreenProps {
  ready: boolean;
}

export default function LoadingScreen({ ready }: LoadingScreenProps) {
  const [tipIndex, setTipIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setTipIndex((i) => (i + 1) % TIPS.length);
    }, 700);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (ready) {
      const t = setTimeout(() => setVisible(false), 600);
      return () => clearTimeout(t);
    }
  }, [ready]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0d0400] transition-opacity duration-500 ${
        ready ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Pixel skyline silhouette */}
      <div className="mb-8 flex items-end gap-1 opacity-30">
        {[24, 40, 16, 60, 28, 48, 20, 36, 52, 18, 44].map((h, i) => (
          <div
            key={i}
            className="bg-[#ff6b35]"
            style={{ width: 12, height: h }}
          />
        ))}
      </div>

      {/* Logo */}
      <div className="mb-6 font-pixel text-2xl tracking-widest text-[#ff6b35]">
        THE VIBE CODE CITY
      </div>

      {/* Animated dots */}
      <div className="mb-4 flex gap-2">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="h-2 w-2 bg-[#ff6b35]"
            style={{ animation: `blink-dot 1s steps(1) ${i * 0.3}s infinite` }}
          />
        ))}
      </div>

      {/* Tip text */}
      <div className="font-pixel text-xs text-[#8a5a3a]">{TIPS[tipIndex]}</div>
    </div>
  );
}
