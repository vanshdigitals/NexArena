'use client';

import { useState, useEffect } from 'react';
import { subscribeToZoneDensity, type ZoneDensity } from '@/lib/firestore';

/**
 * StadiumMap
 *
 * ✅ 100% SVG — zero external API dependencies.
 * ✅ Firestore real-time density data drives marker colours.
 * ✅ Click any marker → floating popup card appears on the map.
 * ✅ Transparent 28 × 28 hit-rect per marker for reliable click targets.
 *
 * Density colour rules (mirrors lib/firestore.ts ZoneDensity 0-100 scale):
 *   0–39  → green  (#10b981) Low
 *   40–69 → amber  (#f59e0b) Moderate
 *   70+   → red    (#ef4444) High
 */

// ── Types ──────────────────────────────────────────────────────────────────

interface ZoneConfig {
  /** Firestore field name that holds this zone's density (0-100). */
  firestoreField: keyof Omit<ZoneDensity, 'updatedAt'>;
  id: string;
  label: string;
  sublabel: string;
  /** Static accent colour used for the marker ring / card border. */
  accentColor: string;
  /** SVG marker centre coordinates (viewBox 0 0 400 260). */
  cx: number;
  cy: number;
  /** Where the label text is anchored relative to the marker. */
  textAnchor: 'start' | 'middle' | 'end';
  textX: number;
  textY: number;
  /** Default density if Firestore hasn't loaded yet. */
  defaultDensity: number;
  /** Extra detail shown in the popup. */
  details: string;
  emoji: string;
}

// ── Static zone config (positions / labels / defaults) ────────────────────

const ZONES: ZoneConfig[] = [
  {
    id: 'gate-a',
    firestoreField: 'gateA',
    label: 'Gate A',
    sublabel: 'North Entrance',
    accentColor: '#3b82f6',
    cx: 200, cy: 36,
    textAnchor: 'middle', textX: 200, textY: 22,
    defaultDensity: 45,
    details: 'Main north entrance · 3 security lanes open',
    emoji: '🔵',
  },
  {
    id: 'gate-b',
    firestoreField: 'gateB',
    label: 'Gate B',
    sublabel: 'South Entrance',
    accentColor: '#8b5cf6',
    cx: 200, cy: 224,
    textAnchor: 'middle', textX: 200, textY: 252,
    defaultDensity: 72,
    details: 'South entrance · expect 8-10 min wait',
    emoji: '🟣',
  },
  {
    id: 'food-court',
    firestoreField: 'foodCourt',
    label: 'Food Court',
    sublabel: 'West Concourse',
    accentColor: '#10b981',
    cx: 36, cy: 130,
    textAnchor: 'start', textX: 56, textY: 120,
    defaultDensity: 30,
    details: 'West concourse · ~4 min wait · 12 stalls open',
    emoji: '🍔',
  },
  {
    id: 'nearest-exit',
    firestoreField: 'sectionD',
    label: 'Exit',
    sublabel: 'Emergency Exit',
    accentColor: '#f59e0b',
    cx: 364, cy: 130,
    textAnchor: 'end', textX: 344, textY: 120,
    defaultDensity: 20,
    details: 'East emergency exit · clearest route out',
    emoji: '🚪',
  },
];

// ── Density helpers ────────────────────────────────────────────────────────

type DensityLevel = 'Low' | 'Moderate' | 'High';

function getDensityLevel(v: number): DensityLevel {
  if (v < 40) return 'Low';
  if (v < 70) return 'Moderate';
  return 'High';
}

function getDensityColor(v: number): string {
  if (v < 40) return '#10b981'; // green
  if (v < 70) return '#f59e0b'; // amber
  return '#ef4444';             // red
}

function getDensityBarWidth(v: number): string {
  return `${Math.min(100, Math.max(0, v))}%`;
}

// ── Popup position helper ─────────────────────────────────────────────────
// Returns a CSS top/left percentage so the popup stays inside the SVG container.

interface PopupPos { top: string; left: string; transformOrigin: string }

function getPopupPosition(cx: number, cy: number): PopupPos {
  // SVG viewBox is 0 0 400 260. Convert to percentages.
  const pctX = (cx / 400) * 100;
  const pctY = (cy / 260) * 100;

  // Flip horizontally for right-side zones, vertically for bottom zones.
  const flipX = cx > 260;
  const flipY = cy > 160;

  return {
    top:  `${pctY}%`,
    left: `${pctX}%`,
    transformOrigin: `${flipX ? 'right' : 'left'} ${flipY ? 'bottom' : 'top'}`,
  };
}

// ── Component ────────────────────────────────────────────────────────────

export default function StadiumMap() {
  const [activeId,  setActiveId]  = useState<string | null>(null);
  // density map: firestoreField → current value (0-100)
  const [densities, setDensities] = useState<Partial<ZoneDensity>>({
    gateA:     45,
    gateB:     72,
    foodCourt: 30,
    sectionD:  20,
  });
  const [fsConnected, setFsConnected] = useState(false);

  // ── Firestore real-time subscription ─────────────────────────────────────
  useEffect(() => {
    let unsub: (() => void) | undefined;
    try {
      unsub = subscribeToZoneDensity((data) => {
        if (Object.keys(data).length > 0) {
          setDensities(prev => ({ ...prev, ...data }));
          setFsConnected(true);
        }
      });
    } catch {
      // Firebase not configured — silently use defaults
    }
    return () => { unsub?.(); };
  }, []);

  const activeZone = ZONES.find(z => z.id === activeId) ?? null;

  return (
    <div
      role="region"
      aria-label="Interactive SVG stadium zone map"
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
        padding: '12px 12px 0',
      }}
      onClick={e => {
        // Close popup when clicking outside a marker
        if ((e.target as SVGElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'DIV') {
          setActiveId(null);
        }
      }}
    >
      {/* ── Background grid ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.08 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="sgrid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#3b82f6" strokeWidth="0.6" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#sgrid)" />
      </svg>

      {/* ── Radial ambient glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', width: '60%', height: '60%', top: '20%', left: '20%',
          background: 'radial-gradient(ellipse, hsla(217,91%,60%,0.07) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Firestore status pill ── */}
      <div
        aria-label={fsConnected ? 'Firestore live data connected' : 'Using default density data'}
        style={{
          position: 'absolute', top: 10, right: 12,
          display: 'flex', alignItems: 'center', gap: 5,
          padding: '3px 9px',
          background: 'hsla(222,40%,14%,0.9)',
          border: `1px solid ${fsConnected ? '#10b98133' : '#f59e0b33'}`,
          borderRadius: 99,
          zIndex: 10,
        }}
      >
        <span style={{
          width: 6, height: 6, borderRadius: '50%',
          background: fsConnected ? '#10b981' : '#f59e0b',
          boxShadow: `0 0 6px ${fsConnected ? '#10b981' : '#f59e0b'}`,
          animation: 'blink 1.5s ease-in-out infinite',
        }} aria-hidden="true" />
        <span style={{ fontSize: '0.6rem', color: fsConnected ? '#10b981' : '#f59e0b', fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase' }}>
          {fsConnected ? 'Live' : 'Demo'}
        </span>
      </div>

      {/* ── SVG Map ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, flex: '1 1 auto', minHeight: 0 }}>
        <svg
          viewBox="0 0 400 260"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', maxHeight: 300, overflow: 'visible', display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="mglow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="grass" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#10b981" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#059669" stopOpacity="0.06" />
            </radialGradient>
            <radialGradient id="track" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#1e3a5f" stopOpacity="0" />
              <stop offset="100%" stopColor="#1e3a5f" stopOpacity="0.55" />
            </radialGradient>
          </defs>

          {/* Stadium shell */}
          <ellipse cx="200" cy="130" rx="190" ry="118" fill="hsl(222,40%,9%)" stroke="#1e3a5f" strokeWidth="2" />

          {/* Stands */}
          {[185, 172, 159].map((rx, i) => (
            <ellipse key={rx} cx="200" cy="130" rx={rx} ry={rx * 0.62}
              fill="none" stroke={`hsla(217,50%,40%,${0.22 - i * 0.06})`} strokeWidth="6" />
          ))}

          {/* Track */}
          <ellipse cx="200" cy="130" rx="148" ry="92" fill="url(#track)"
            stroke="#2563eb" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.65" />

          {/* Field */}
          <ellipse cx="200" cy="130" rx="128" ry="78" fill="url(#grass)" stroke="#10b981" strokeWidth="1.5" opacity="0.9" />

          {/* Field markings */}
          <circle cx="200" cy="130" r="22" fill="none" stroke="#10b981" strokeWidth="1" opacity="0.45" />
          <circle cx="200" cy="130" r="3"  fill="#10b981" opacity="0.6" />
          <line x1="72" y1="130" x2="328" y2="130" stroke="#10b981" strokeWidth="1" opacity="0.25" />
          <rect x="174" y="52"  width="52" height="20" rx="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.55" />
          <rect x="174" y="188" width="52" height="20" rx="3" fill="none" stroke="#f59e0b" strokeWidth="1.5" opacity="0.55" />
          <path d="M 178 72 Q 200 85 222 72"  fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.35" />
          <path d="M 178 188 Q 200 175 222 188" fill="none" stroke="#f59e0b" strokeWidth="1" opacity="0.35" />

          {/* ── Zone markers ── */}
          {ZONES.map(zone => {
            const density      = densities[zone.firestoreField] ?? zone.defaultDensity;
            const mColor       = getDensityColor(density);
            const level        = getDensityLevel(density);
            const isActive     = activeId === zone.id;

            return (
              <g
                key={zone.id}
                onClick={e => { e.stopPropagation(); setActiveId(isActive ? null : zone.id); }}
                style={{ cursor: 'pointer' }}
                aria-label={`${zone.label} — ${zone.sublabel}. Crowd density: ${level} (${density}%)`}
                role="button"
                tabIndex={0}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setActiveId(isActive ? null : zone.id); }}
              >
                {/* Outer pulse ring — density colour */}
                <circle
                  cx={zone.cx} cy={zone.cy}
                  r={isActive ? 24 : 19}
                  fill={mColor}
                  opacity={isActive ? 0.22 : 0.13}
                  style={{ transition: 'all 0.25s ease' }}
                />
                {/* Accent ring — zone accent colour */}
                <circle
                  cx={zone.cx} cy={zone.cy} r={isActive ? 14 : 11}
                  fill="none"
                  stroke={zone.accentColor}
                  strokeWidth={isActive ? 1.5 : 1}
                  opacity={0.5}
                  style={{ transition: 'all 0.25s ease' }}
                />
                {/* Main marker — density colour */}
                <circle
                  cx={zone.cx} cy={zone.cy} r={10}
                  fill={mColor}
                  stroke="#0a0e1a"
                  strokeWidth="2"
                  filter="url(#mglow)"
                  style={{ transition: 'fill 0.4s ease' }}
                />
                {/* White inner dot */}
                <circle cx={zone.cx} cy={zone.cy} r={3.5} fill="#fff" opacity="0.92" />

                {/* Transparent hit-area for reliable click events */}
                <rect
                  x={zone.cx - 16} y={zone.cy - 16}
                  width="32" height="32"
                  fill="transparent"
                  style={{ cursor: 'pointer' }}
                />

                {/* Zone label */}
                <text
                  x={zone.textX} y={zone.textY}
                  textAnchor={zone.textAnchor}
                  fill={zone.accentColor}
                  fontSize="8.5"
                  fontFamily="Outfit, sans-serif"
                  fontWeight="700"
                  letterSpacing="0.4"
                  style={{ userSelect: 'none', pointerEvents: 'none' }}
                >
                  {zone.label}
                </text>
              </g>
            );
          })}
        </svg>

        {/* ── Floating popup — rendered in HTML over the SVG ── */}
        {activeZone && (() => {
          const density  = densities[activeZone.firestoreField] ?? activeZone.defaultDensity;
          const dColor   = getDensityColor(density);
          const dLevel   = getDensityLevel(density);
          const pos      = getPopupPosition(activeZone.cx, activeZone.cy);
          const flipX    = activeZone.cx > 260;
          const flipY    = activeZone.cy > 160;

          return (
            <div
              role="dialog"
              aria-modal="false"
              aria-label={`${activeZone.label} zone information`}
              style={{
                position: 'absolute',
                top:  pos.top,
                left: pos.left,
                transform: `translate(${flipX ? 'calc(-100% - 10px)' : '10px'}, ${flipY ? 'calc(-100% - 8px)' : '8px'})`,
                transformOrigin: pos.transformOrigin,
                zIndex: 20,
                width: 210,
                background: 'hsla(222,45%,11%,0.97)',
                border: `1px solid ${activeZone.accentColor}55`,
                borderLeft: `3px solid ${activeZone.accentColor}`,
                borderRadius: 12,
                padding: '12px 14px',
                backdropFilter: 'blur(16px)',
                boxShadow: `0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px ${activeZone.accentColor}22`,
                animation: 'bubble-in 160ms ease both',
                pointerEvents: 'auto',
              }}
            >
              {/* Close button */}
              <button
                onClick={e => { e.stopPropagation(); setActiveId(null); }}
                aria-label={`Close ${activeZone.label} info`}
                style={{
                  position: 'absolute', top: 8, right: 8,
                  width: 20, height: 20,
                  borderRadius: '50%',
                  background: 'hsla(215,30%,20%,0.8)',
                  border: 'none',
                  color: '#6b8aaa',
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  lineHeight: 1,
                  padding: 0,
                }}
              >
                ×
              </button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <span aria-hidden="true" style={{ fontSize: '1.1rem' }}>{activeZone.emoji}</span>
                <div>
                  <p style={{ fontSize: '0.875rem', fontWeight: 700, color: '#f0f4ff', lineHeight: 1.2 }}>
                    {activeZone.label}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: '#6b8aaa', marginTop: 1 }}>
                    {activeZone.sublabel}
                  </p>
                </div>
              </div>

              {/* Density bar */}
              <div style={{ marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                  <span style={{ fontSize: '0.6875rem', color: '#6b8aaa', fontWeight: 600 }}>Crowd Density</span>
                  <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: dColor, fontFamily: 'monospace' }}>
                    {density}% — {dLevel}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 3, background: 'hsla(215,30%,20%,0.8)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: getDensityBarWidth(density),
                    background: `linear-gradient(90deg, #10b981, ${dColor})`,
                    borderRadius: 3,
                    transition: 'width 0.5s ease',
                  }} />
                </div>
              </div>

              {/* Detail text */}
              <p style={{ fontSize: '0.6875rem', color: '#8aafcc', lineHeight: 1.5 }}>
                {activeZone.details}
              </p>

              {/* Firestore badge */}
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{
                  width: 5, height: 5, borderRadius: '50%',
                  background: fsConnected ? '#10b981' : '#f59e0b',
                  flexShrink: 0,
                }} aria-hidden="true" />
                <span style={{ fontSize: '0.6rem', color: '#4a6280', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {fsConnected ? 'Live Firestore data' : 'Demo data'}
                </span>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Legend strip ── */}
      <div
        role="list"
        aria-label="Density colour legend"
        style={{
          display: 'flex', gap: 12, flexShrink: 0,
          padding: '8px 4px 10px',
          flexWrap: 'wrap', justifyContent: 'center',
        }}
      >
        {([['#10b981','Low'],['#f59e0b','Moderate'],['#ef4444','High']] as const).map(([color, label]) => (
          <div key={label} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: color, boxShadow: `0 0 5px ${color}` }} aria-hidden="true" />
            <span style={{ fontSize: '0.6875rem', color: '#4a6280', fontWeight: 500 }}>{label}</span>
          </div>
        ))}
        <span style={{ fontSize: '0.6875rem', color: '#2a3f55', marginLeft: 6, fontFamily: 'monospace', letterSpacing: '0.04em' }}>
          NexArena Map
        </span>
      </div>

      {/* ── Hint text ── */}
      <p
        aria-live="polite"
        style={{ fontSize: '0.6875rem', color: '#2e4a66', textAlign: 'center', paddingBottom: 8, flexShrink: 0 }}
      >
        {activeId ? '' : 'Tap a marker to view zone details'}
      </p>
    </div>
  );
}
