'use client';

import React from 'react';

export default function SplashScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: '#0B0F19',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      }}
    >
      <style>{`
        @keyframes hexEntry {
          from { opacity: 0; transform: scale(0.5) rotate(-60deg); }
          70%  { opacity: 1; transform: scale(1.08) rotate(5deg); }
          to   { opacity: 1; transform: scale(1) rotate(0deg); }
        }
        @keyframes hexSpin3d {
          0%   { transform: rotateY(0deg)   rotateX(5deg);  }
          50%  { transform: rotateY(180deg) rotateX(-5deg); }
          100% { transform: rotateY(360deg) rotateX(5deg);  }
        }
        @keyframes splashFadeUp {
          from { opacity: 0; transform: translateY(14px); filter: blur(4px); }
          to   { opacity: 1; transform: translateY(0);    filter: blur(0);   }
        }
        @keyframes dotPulse {
          0%, 100% { opacity: 0.35; transform: scale(1);   }
          50%      { opacity: 1;    transform: scale(1.35); }
        }

        .splash-hex-wrap {
          width: 180px;
          height: 180px;
          perspective: 800px;
          opacity: 0;
          animation: hexEntry 0.9s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s forwards;
        }
        .splash-hex-rotator {
          width: 100%;
          height: 100%;
          transform-style: preserve-3d;
          animation: hexSpin3d 12s linear infinite;
        }
        .splash-wordmark {
          opacity: 0;
          animation: splashFadeUp 0.6s ease-out 0.55s forwards;
        }
        .splash-tagline-text {
          opacity: 0;
          animation: splashFadeUp 0.6s ease-out 0.80s forwards;
        }
        .splash-dots-row {
          opacity: 0;
          animation: splashFadeUp 0.5s ease-out 1.05s forwards;
        }
        .splash-dot:nth-child(1) { animation: dotPulse 2.2s ease-in-out 1.3s infinite; }
        .splash-dot:nth-child(2) { animation: dotPulse 2.2s ease-in-out 1.5s infinite; }
        .splash-dot:nth-child(3) { animation: dotPulse 2.2s ease-in-out 1.7s infinite; }
      `}</style>

      {/* ── Background orbs — atmosphere without patterns ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 420, height: 420, background: '#06B6D4',
          filter: 'blur(60px)', opacity: 0.10,
          top: '-8%', left: '-6%',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 360, height: 360, background: '#8B5CF6',
          filter: 'blur(60px)', opacity: 0.10,
          bottom: '-8%', right: '-5%',
        }}
      />
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', borderRadius: '50%', pointerEvents: 'none',
          width: 300, height: 300, background: '#22C55E',
          filter: 'blur(60px)', opacity: 0.10,
          top: '38%', right: '8%',
        }}
      />

      {/* ── CSS 3D Rotating Hexagon Logo — 180x180 ── */}
      <div className="splash-hex-wrap">
        <div className="splash-hex-rotator">
          <svg
            width="180"
            height="180"
            viewBox="0 0 180 180"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            {/* Outer hexagon — cyan stroke */}
            <polygon
              points="90,18 150.6,54 150.6,126 90,162 29.4,126 29.4,54"
              stroke="#06B6D4"
              strokeWidth="2"
              strokeLinejoin="round"
              fill="none"
            />
            {/* Inner hexagon — purple stroke, rotated 30deg */}
            <polygon
              points="90,48 126.4,69 126.4,111 90,132 53.6,111 53.6,69"
              stroke="#8B5CF6"
              strokeWidth="1.5"
              strokeLinejoin="round"
              fill="none"
              transform="rotate(30, 90, 90)"
            />
            {/* Centre dot — green, 8px diameter */}
            <circle cx="90" cy="90" r="4" fill="#22C55E" />
          </svg>
        </div>
      </div>

      {/* ── Wordmark ── */}
      <h1
        className="splash-wordmark"
        style={{
          fontFamily: "'Outfit', sans-serif",
          fontSize: 38,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: '#ffffff',
          marginTop: 28,
          lineHeight: 1,
        }}
      >
        NEXARENA
      </h1>

      {/* ── Tagline ── */}
      <p
        className="splash-tagline-text"
        style={{
          fontFamily: "'Inter', sans-serif",
          fontSize: 12,
          letterSpacing: '0.25em',
          color: '#06B6D4',
          marginTop: 14,
          textTransform: 'uppercase',
        }}
      >
        YOUR STADIUM. YOUR WORLD.
      </p>

      {/* ── 3-dot accent row ── */}
      <div className="splash-dots-row" style={{ display: 'flex', gap: 10, marginTop: 28 }}>
        <span className="splash-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#06B6D4', display: 'block' }} />
        <span className="splash-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#8B5CF6', display: 'block' }} />
        <span className="splash-dot" style={{ width: 7, height: 7, borderRadius: '50%', background: '#22C55E', display: 'block' }} />
      </div>
    </div>
  );
}
