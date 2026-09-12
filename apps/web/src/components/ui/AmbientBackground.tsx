import React from 'react';

export interface AmbientBackgroundProps {
  variant?: 'landing' | 'quiet';
}

export const AmbientBackground: React.FC<AmbientBackgroundProps> = ({ variant = 'landing' }) => {
  const isQuiet = variant === 'quiet';

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0 select-none bg-background transition-colors duration-300">
      {/* 01 — Pinterest Background Asset Layer (Rich, Vibrant & Clear) */}
      <div className="absolute inset-0 transition-opacity duration-700">
        <img
          src="/bg.png"
          alt=""
          className={`w-full h-full object-cover object-center transition-all duration-1000 ${
            isQuiet ? 'opacity-20 scale-100' : 'opacity-75 dark:opacity-65 scale-105'
          }`}
          aria-hidden="true"
        />

        {/* Gradient & Overlay system to ensure text readability without dulling the background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background/60 via-background/25 to-background/90" />
        <div className="absolute inset-0 bg-radial-gradient from-transparent via-background/30 to-background/80" />
      </div>

      {/* 02 — Soft Drifting Atmospheric Accent Light Fields */}
      <div className="absolute inset-0 overflow-hidden opacity-60 dark:opacity-45 pointer-events-none">
        {/* Soft Violet / Lavender Glow */}
        <div
          className={`absolute -top-[15%] -left-[10%] w-[75vw] h-[75vw] max-w-[850px] max-h-[850px] rounded-full bg-gradient-to-br from-violet-600/30 via-purple-500/20 to-transparent blur-[130px] animate-soft-drift-1 ${
            isQuiet ? 'opacity-20' : 'opacity-75'
          }`}
        />

        {/* Soft Pink / Rose Glow */}
        <div
          className={`absolute top-[15%] -right-[15%] w-[70vw] h-[70vw] max-w-[800px] max-h-[800px] rounded-full bg-gradient-to-bl from-pink-500/25 via-fuchsia-400/15 to-transparent blur-[140px] animate-soft-drift-2 ${
            isQuiet ? 'opacity-15' : 'opacity-65'
          }`}
        />

        {/* Soft Sky Blue Glow */}
        <div
          className={`absolute bottom-[10%] left-[20%] w-[65vw] h-[65vw] max-w-[750px] max-h-[750px] rounded-full bg-gradient-to-tr from-sky-500/25 via-indigo-400/15 to-transparent blur-[150px] animate-soft-drift-3 ${
            isQuiet ? 'opacity-15' : 'opacity-60'
          }`}
        />
      </div>

      {/* 03 — Subtle Tactile Grain Overlay */}
      <div className="absolute inset-0 bg-noise mix-blend-overlay opacity-10 dark:opacity-10 pointer-events-none" />
    </div>
  );
};




