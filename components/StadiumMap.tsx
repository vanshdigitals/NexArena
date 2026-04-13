'use client';

import { useState } from 'react';

/**
 * StadiumMap
 * Self-contained SVG stadium map with interactive zone markers.
 * No external API dependency — all zones, colours, and labels are built in.
 *
 * Zones:
 *   Gate A      → blue    (#3b82f6) — North entrance
 *   Gate B      → purple  (#8b5cf6) — South entrance
 *   Food Court  → green   (#10b981) — West concourse
 *   Nearest Exit→ amber   (#f59e0b) — East emergency exit
 */

interface Zone {
  id: string;
  label: string;
  sublabel: string;
  color: string;
  cx: number;
  cy: number;
  textAnchor: 'start' | 'middle' | 'end';
  textX: number;
  textY: number;
  density: 'Low' | 'Moderate' | 'High';
  densityColor: string;
}

const ZONES: Zone[] = [
  {
    id: 'gate-a',
    label: 'Gate A',
    sublabel: 'North Entrance',
    color: '#3b82f6',
    cx: 200, cy: 36,
    textAnchor: 'middle', textX: 200, textY: 22,
    density: 'Moderate',
    densityColor: '#f59e0b',
  },
  {
    id: 'gate-b',
    label: 'Gate B',
    sublabel: 'South Entrance',
    color: '#8b5cf6',
    cx: 200, cy: 224,
    textAnchor: 'middle', textX: 200, textY: 252,
    density: 'High',
    densityColor: '#ef4444',
  },
  {
    id: 'food-court',
    label: 'Food Court',
    sublabel: 'West Concourse',
    color: '#10b981',
    cx: 36, cy: 130,
    textAnchor: 'start', textX: 4, textY: 120,
    density: 'Low',
    densityColor: '#10b981',
  },
  {
    id: 'nearest-exit',
    label: 'Exit',
    sublabel: 'Emergency Exit',
    color: '#f59e0b',
    cx: 364, cy: 130,
    textAnchor: 'end', textX: 396, textY: 120,
    density: 'Low',
    densityColor: '#10b981',
  },
];

export default function StadiumMap() {
  const [activeZone, setActiveZone] = useState<string | null>(null);

  const active = ZONES.find(z => z.id === activeZone) ?? null;

  return (
    <div
      role="img"
      aria-label="Interactive SVG stadium zone map showing Gate A, Gate B, Food Court, and Nearest Exit"
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, hsl(222,47%,6%) 0%, hsl(222,40%,10%) 100%)',
        position: 'relative',
        overflow: 'hidden',
        padding: '16px',
        gap: 0,
      }}
    >
      {/* ── Animated background grid ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.1 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="svg-map-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#svg-map-grid)" />
      </svg>

      {/* ── Radial glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          width: '60%',
          height: '60%',
          top: '20%',
          left: '20%',
          background: 'radial-gradient(ellipse, hsla(217,91%,60%,0.08) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Stadium SVG ── */}
      <svg
        viewBox="0 0 400 260"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          maxWidth: 480,
          height: 'auto',
          maxHeight: 320,
          overflow: 'visible',
          flex: '1 1 auto',
          minHeight: 0,
        }}
        aria-hidden="true"
      >
        <defs>
          {/* Outer stadium glow filter */}
          <filter id="zone-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
          <filter id="marker-glow" x="-100%" y="-100%" width="300%" height="300%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Grass gradient */}
          <radialGradient id="grass-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#059669" stopOpacity="0.08" />
          </radialGradient>

          {/* Track gradient */}
          <radialGradient id="track-grad" cx="50%" cy="50%" r="50%">
            <stop offset="0%"  stopColor="#1e3a5f" stopOpacity="0" />
            <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.6" />
          </radialGradient>
        </defs>

        {/* ── Outer stadium boundary ── */}
        <ellipse
          cx="200" cy="130" rx="190" ry="118"
          fill="hsl(222,40%,9%)"
          stroke="#1e3a5f"
          strokeWidth="2"
        />

        {/* ── Spectator stands (concentric rings) ── */}
        {[185, 172, 159].map((rx, i) => (
          <ellipse
            key={rx}
            cx="200" cy="130" rx={rx} ry={rx * 0.62}
            fill="none"
            stroke={`hsla(217,50%,40%,${0.25 - i * 0.07})`}
            strokeWidth="6"
          />
        ))}

        {/* ── Running track ── */}
        <ellipse
          cx="200" cy="130" rx="148" ry="92"
          fill="url(#track-grad)"
          stroke="#2563eb"
          strokeWidth="1.5"
          strokeDasharray="6 3"
          opacity="0.7"
        />

        {/* ── Playing field ── */}
        <ellipse
          cx="200" cy="130" rx="128" ry="78"
          fill="url(#grass-grad)"
          stroke="#10b981"
          strokeWidth="1.5"
          opacity="0.9"
        />

        {/* Field markings: centre circle */}
        <circle
          cx="200" cy="130" r="22"
          fill="none"
          stroke="#10b981"
          strokeWidth="1"
          opacity="0.5"
        />
        {/* Centre spot */}
        <circle cx="200" cy="130" r="3" fill="#10b981" opacity="0.6" />

        {/* Centre line (horizontal) */}
        <line
          x1="72" y1="130" x2="328" y2="130"
          stroke="#10b981" strokeWidth="1" opacity="0.3"
        />

        {/* Goal areas */}
        <rect x="174" y="52"  width="52" height="20" rx="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />
        <rect x="174" y="188" width="52" height="20" rx="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.6" />

        {/* Penalty arcs */}
        <path d="M 178 72 Q 200 85 222 72" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />
        <path d="M 178 188 Q 200 175 222 188" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.4" />

        {/* ── Zone markers ── */}
        {ZONES.map((zone) => {
          const isActive = activeZone === zone.id;
          return (
            <g
              key={zone.id}
              style={{ cursor: 'pointer' }}
              onClick={() => setActiveZone(isActive ? null : zone.id)}
              role="button"
              aria-label={`${zone.label} — ${zone.sublabel}. Crowd density: ${zone.density}`}
            >
              {/* Pulsing ring */}
              <circle
                cx={zone.cx} cy={zone.cy}
                r={isActive ? 22 : 18}
                fill={zone.color}
                opacity={isActive ? 0.2 : 0.12}
                style={{ transition: 'all 0.25s ease' }}
              />
              {/* Marker circle */}
              <circle
                cx={zone.cx} cy={zone.cy} r={10}
                fill={zone.color}
                stroke="#0f1629"
                strokeWidth="2"
                filter="url(#marker-glow)"
                style={{ transition: 'r 0.2s ease' }}
              />
              {/* Inner dot */}
              <circle
                cx={zone.cx} cy={zone.cy} r={4}
                fill="#ffffff"
                opacity="0.9"
              />
              {/* Transparent hit-area — ensures pointer events fire reliably
                  across all browsers regardless of SVG fill rules           */}
              <rect
                x={zone.cx - 14} y={zone.cy - 14}
                width="28" height="28"
                fill="transparent"
                style={{ cursor: 'pointer' }}
              />

              {/* Zone label */}
              <text
                x={zone.textX} y={zone.textY}
                textAnchor={zone.textAnchor}
                fill={zone.color}
                fontSize="9"
                fontFamily="Outfit, sans-serif"
                fontWeight="700"
                letterSpacing="0.5"
              >
                {zone.label}
              </text>
            </g>
          );
        })}
      </svg>

      {/* ── Active zone info card ── */}
      <div
        aria-live="polite"
        aria-atomic="true"
        style={{
          flexShrink: 0,
          width: '100%',
          maxWidth: 480,
          minHeight: 52,
          marginTop: 8,
        }}
      >
        {active ? (
          <div
            style={{
              background: `hsla(222,40%,12%,0.95)`,
              border: `1px solid ${active.color}44`,
              borderLeft: `3px solid ${active.color}`,
              borderRadius: 10,
              padding: '10px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              backdropFilter: 'blur(8px)',
              animation: 'bubble-in 180ms ease both',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  width: 10, height: 10, borderRadius: '50%',
                  background: active.color,
                  boxShadow: `0 0 8px ${active.color}`,
                  flexShrink: 0,
                }}
                aria-hidden="true"
              />
              <div>
                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f4ff', lineHeight: 1.2 }}>
                  {active.label}
                </p>
                <p style={{ fontSize: '0.6875rem', color: '#6b8aaa', marginTop: 2 }}>
                  {active.sublabel}
                </p>
              </div>
            </div>
            <div style={{ textAlign: 'right', flexShrink: 0 }}>
              <p style={{ fontSize: '0.6875rem', color: '#6b8aaa', marginBottom: 2 }}>Crowd density</p>
              <p style={{ fontSize: '0.8125rem', fontWeight: 700, color: active.densityColor }}>
                {active.density}
              </p>
            </div>
          </div>
        ) : (
          <p style={{ fontSize: '0.6875rem', color: '#4a6280', textAlign: 'center', paddingTop: 4 }}>
            Tap a zone marker to view details
          </p>
        )}
      </div>

      {/* ── ARIA-hidden decorative label ── */}
      <p
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: 10,
          right: 14,
          fontSize: '0.6rem',
          color: '#2a3f55',
          fontFamily: 'monospace',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        NexArena · Venue Map
      </p>
    </div>
  );
}
