import React from 'react';

export default function AlphaOmegaLogo({ size = 280, className = '' }) {
  return (
    <div className={`flex flex-col items-center ${className}`}>
      <svg viewBox="0 0 500 500" width={size} height={size}>
        <defs>
          <linearGradient id="gold-gradient" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9A7432" />
            <stop offset="15%" stopColor="#CBA358" />
            <stop offset="50%" stopColor="#F7E5A9" />
            <stop offset="65%" stopColor="#D8B467" />
            <stop offset="100%" stopColor="#9A7432" />
          </linearGradient>
          <filter id="drop-shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#000000" floodOpacity="0.6" />
          </filter>
        </defs>
        <g filter="url(#drop-shadow)">
          <path d="M 145,340 C 120,290 120,190 200,145 C 220,135 280,135 300,145 C 380,190 380,290 355,340 L 390,340 L 390,360 L 330,360 L 330,340 L 340,340 C 360,290 350,210 290,175 C 270,165 230,165 210,175 C 150,210 140,290 160,340 L 170,340 L 170,360 L 110,360 L 110,340 Z" fill="url(#gold-gradient)" />
          <path d="M 250,60 L 370,340 L 330,340 L 250,150 L 170,340 L 130,340 Z" fill="url(#gold-gradient)" />
          <path d="M 180,340 L 220,250 L 280,250 L 320,340 L 290,340 L 265,280 L 235,280 L 210,340 Z" fill="url(#gold-gradient)" />
          <circle cx="250" cy="210" r="12" fill="url(#gold-gradient)" />
          <line x1="250" y1="210" x2="250" y2="360" stroke="url(#gold-gradient)" strokeWidth="4" />
          <circle cx="250" cy="275" r="7" fill="url(#gold-gradient)" />
          <line x1="250" y1="210" x2="205" y2="260" stroke="url(#gold-gradient)" strokeWidth="4" strokeDasharray="1,5" strokeLinecap="round" />
          <circle cx="205" cy="260" r="7" fill="url(#gold-gradient)" />
          <line x1="250" y1="210" x2="295" y2="260" stroke="url(#gold-gradient)" strokeWidth="4" strokeDasharray="1,5" strokeLinecap="round" />
          <circle cx="295" cy="260" r="7" fill="url(#gold-gradient)" />
        </g>
      </svg>
    </div>
  );
}

export function AlphaOmegaText({ size = 'lg' }) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-5xl'
  };

  const subSizeClasses = {
    sm: 'text-[10px]',
    md: 'text-xs',
    lg: 'text-sm',
    xl: 'text-base'
  };

  return (
    <div className="text-center">
      <h1 className={`font-light tracking-[0.35em] uppercase ${sizeClasses[size]}`} style={{ lineHeight: 1.2 }}>
        <span className="text-white" style={{ textShadow: '0 0 10px rgba(255,255,255,0.2)' }}>ALPH</span>
        <span className="bg-gradient-to-r from-[#ECC880] via-[#CBA358] to-[#9A7432] bg-clip-text text-transparent">A OMÉGA</span>
      </h1>
      <div className="flex items-center justify-center gap-4 mt-2">
        <div className="h-px flex-1 bg-gradient-to-l from-[rgba(203,163,88,0.8)] to-transparent" />
        <h2 className={`font-normal tracking-[0.6em] uppercase ${subSizeClasses[size]} bg-gradient-to-r from-[#F7E5A9] to-[#CBA358] bg-clip-text text-transparent`}>
          DIGITAL
        </h2>
        <div className="h-px flex-1 bg-gradient-to-r from-[rgba(203,163,88,0.8)] to-transparent" />
      </div>
    </div>
  );
}
