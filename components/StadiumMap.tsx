'use client';

import { useState, useEffect, useCallback, useMemo, memo } from 'react';
import { subscribeToZoneDensity, type ZoneDensity } from '@/lib/firestore';
import {
  ZONES,
  getDensityLevel,
  getDensityColor,
  getDensityPulseClass,
  getDensityBarWidth,
} from '@/lib/stadium-utils';
// Analytics loaded lazily to avoid SSR bundling issues

/**
 * StadiumMap - Premium Edition
 *
 * ✅ 100% SVG — zero external API dependencies.
 * ✅ Premium visual effects with animated pulsing markers.
 * ✅ Sleek bottom-anchored "Slide-up drawer" card on click.
 * ✅ Optimised with React.memo, useCallback, useMemo.
 */

// ── Component ────────────────────────────────────────────────────────────

function StadiumMap() {
  const [activeId,  setActiveId]  = useState<string | null>(null);
  const [densities, setDensities] = useState<Partial<ZoneDensity>>({
    gateA:     45,
    gateB:     72,
    foodCourt: 30,
    sectionD:  20,
  });
  const [fsConnected, setFsConnected] = useState(false);

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
      // Firebase not configured
    }
    return () => { unsub?.(); };
  }, []);

  const activeZone = useMemo(() => ZONES.find(z => z.id === activeId) ?? null, [activeId]);

  const handleZoneClick = useCallback((zoneId: string) => {
    setActiveId(prev => {
      const next = prev === zoneId ? null : zoneId;
      if (next) {
        const zone = ZONES.find(z => z.id === next);
        if (zone) {
          const density = densities[zone.firestoreField] ?? zone.defaultDensity;
          import('@/lib/analytics').then(({ logZoneClicked }) => logZoneClicked(next, density));
        }
      }
      return next;
    });
  }, [densities]);

  const handleCloseDrawer = useCallback(() => {
    setActiveId(null);
  }, []);

  const handleBackgroundClick = useCallback((e: React.MouseEvent) => {
    if ((e.target as SVGElement).tagName === 'svg' || (e.target as HTMLElement).tagName === 'DIV') {
      setActiveId(null);
    }
  }, []);

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
        background: 'transparent',
        position: 'relative',
        overflow: 'hidden',
        padding: '24px',
      }}
      onClick={handleBackgroundClick}
    >
      {/* ── Background grid pattern layer ── */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.15 }}
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <pattern id="premiumGrid" width="60" height="60" patternUnits="userSpaceOnUse">
            <path d="M 60 0 L 0 0 0 60" fill="none" stroke="var(--brand-primary)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#premiumGrid)" />
      </svg>

      {/* ── Radial ambient glow ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute', width: '80%', height: '80%', top: '10%', left: '10%',
          background: 'radial-gradient(ellipse, rgba(0,229,255,0.08) 0%, transparent 60%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Live Badge ── */}
      <div
        aria-label={fsConnected ? 'Firestore live data connected' : 'Using default density data'}
        className="glass-card"
        style={{
          position: 'absolute', top: 20, right: 20,
          display: 'flex', alignItems: 'center', gap: 6,
          padding: '6px 12px',
          borderRadius: 99,
          zIndex: 10,
        }}
      >
        <span className={fsConnected ? 'status-dot status-live' : 'status-dot status-warning'} aria-hidden="true" />
        <span className="label-mono" style={{ fontSize: '0.65rem', color: fsConnected ? 'var(--brand-accent)' : 'var(--brand-warning)' }}>
          {fsConnected ? 'Connected' : 'Demo Mode'}
        </span>
      </div>

      {/* ── SVG Map ── */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 700, flex: '1 1 auto', minHeight: 0, display: 'flex', alignItems: 'center', boxShadow: '0 0 80px rgba(0,229,255,0.1)', borderRadius: '50%' }}>
        <svg
          viewBox="0 0 400 280"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: '100%', height: '100%', maxHeight: 450, overflow: 'visible', display: 'block' }}
          aria-hidden="true"
        >
          <defs>
            <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
              <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
            </filter>
            <filter id="mglow" x="-100%" y="-100%" width="300%" height="300%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <radialGradient id="grass" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#00E676" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#00C853" stopOpacity="0.08" />
            </radialGradient>
            <radialGradient id="track" cx="50%" cy="50%" r="50%">
              <stop offset="0%"   stopColor="#0f172a" stopOpacity="0" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.8" />
            </radialGradient>
          </defs>

          {/* Stadium shell drop shadow wrapper */}
          <g transform="translate(0, 10)">
            {/* Outer Rim */}
            <ellipse cx="200" cy="140" rx="190" ry="118" fill="var(--bg-void)" stroke="rgba(0,229,255,0.25)" strokeWidth="2" />

            {/* Stands */}
            {[185, 172, 159].map((rx, i) => (
              <ellipse key={rx} cx="200" cy="140" rx={rx} ry={rx * 0.62}
                fill="none" stroke={`hsla(217,50%,50%,${0.25 - i * 0.05})`} strokeWidth="6" />
            ))}

            {/* Track */}
            <ellipse cx="200" cy="140" rx="148" ry="92" fill="url(#track)"
              stroke="var(--brand-primary)" strokeWidth="1.5" strokeDasharray="6 4" opacity="0.4" />

            {/* Field */}
            <ellipse cx="200" cy="140" rx="128" ry="78" fill="url(#grass)" stroke="var(--brand-accent)" strokeWidth="1.5" opacity="0.8" />

            {/* Field markings */}
            <circle cx="200" cy="140" r="22" fill="none" stroke="var(--brand-accent)" strokeWidth="1" opacity="0.45" />
            <circle cx="200" cy="140" r="3"  fill="var(--brand-accent)" opacity="0.6" />
            <line x1="72" y1="140" x2="328" y2="140" stroke="var(--brand-accent)" strokeWidth="1" opacity="0.3" />
            <rect x="174" y="62"  width="52" height="20" rx="3" fill="none" stroke="var(--brand-warning)" strokeWidth="1.5" opacity="0.6" />
            <rect x="174" y="198" width="52" height="20" rx="3" fill="none" stroke="var(--brand-warning)" strokeWidth="1.5" opacity="0.6" />
            <path d="M 178 82 Q 200 95 222 82"  fill="none" stroke="var(--brand-warning)" strokeWidth="1" opacity="0.4" />
            <path d="M 178 198 Q 200 185 222 198" fill="none" stroke="var(--brand-warning)" strokeWidth="1" opacity="0.4" />

            {/* ── Zone markers ── */}
            {ZONES.map(zone => {
              const density      = densities[zone.firestoreField] ?? zone.defaultDensity;
              const mColor       = getDensityColor(density);
              const level        = getDensityLevel(density);
              const isActive     = activeId === zone.id;
              const pulseClass   = getDensityPulseClass(density);

              // Use standard offset from config, shift down 10 to match stadium translation
              const zcx = zone.cx;
              const zcy = zone.cy + 10;
              const textY = zone.textY + 10;

              return (
                <g
                  key={zone.id}
                  onClick={e => { e.stopPropagation(); handleZoneClick(zone.id); }}
                  style={{ cursor: 'pointer' }}
                  aria-label={`${zone.label} — ${zone.sublabel}. Crowd density: ${level} (${density}%)`}
                  role="button"
                  tabIndex={0}
                  onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') handleZoneClick(zone.id); }}
                >
                  {/* CSS Animated Pulse Ring */}
                  {/* Uses the pulse animation classes defined in globals.css */}
                  <circle
                    className={pulseClass}
                    cx={zcx} cy={zcy}
                    r={20}
                    fill={mColor}
                    style={{ transformOrigin: `${zcx}px ${zcy}px` }}
                  />

                  {/* Outer glow ring */}
                  <circle
                    cx={zcx} cy={zcy}
                    r={isActive ? 20 : 15}
                    fill={mColor}
                    opacity={isActive ? 0.3 : 0.15}
                    style={{ transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)' }}
                  />
                  {/* Accent ring */}
                  <circle
                    cx={zcx} cy={zcy} r={isActive ? 15 : 12}
                    fill="none"
                    stroke={zone.accentColor}
                    strokeWidth={isActive ? 2 : 1.5}
                    opacity={0.8}
                    style={{ transition: 'all 0.3s ease' }}
                  />
                  {/* Main solid marker */}
                  <circle
                    cx={zcx} cy={zcy} r={10}
                    fill={mColor}
                    stroke="var(--bg-void)"
                    strokeWidth="2.5"
                    filter="url(#mglow)"
                    style={{ transition: 'fill 0.4s ease' }}
                  />
                  {/* White inner dot */}
                  <circle cx={zcx} cy={zcy} r={3.5} fill="#fff" opacity="0.95" />

                  {/* Hit area */}
                  <rect
                    x={zcx - 20} y={zcy - 20}
                    width="40" height="40"
                    fill="transparent"
                    style={{ cursor: 'pointer' }}
                  />

                  {/* Zone label */}
                  <text
                    x={zone.textX} y={textY}
                    textAnchor={zone.textAnchor}
                    fill={isActive ? 'white' : 'var(--text-secondary)'}
                    fontSize="10"
                    fontFamily="var(--font-sans)"
                    fontWeight="800"
                    letterSpacing="0.04em"
                    filter={isActive ? 'url(#shadow)' : 'none'}
                    style={{ userSelect: 'none', pointerEvents: 'none', transition: 'fill 0.2s' }}
                  >
                    {zone.label}
                  </text>
                </g>
              );
            })}
          </g>
        </svg>

        {/* ── Slide-up Info Drawer (Replacing small popups) ── */}
        {activeZone && (() => {
          const density  = densities[activeZone.firestoreField] ?? activeZone.defaultDensity;
          const dColor   = getDensityColor(density);
          const dLevel   = getDensityLevel(density);

          return (
            <div
              className="animate-slide-up-card"
              role="dialog"
              aria-modal="false"
              aria-label={`${activeZone.label} detail card`}
              style={{
                position: 'absolute',
                bottom: 12,
                left: '50%',
                transform: 'translateX(-50%)',
                width: 'calc(100% - 24px)',
                maxWidth: 420,
                zIndex: 30,
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderTop: `4px solid ${activeZone.accentColor}`,
                borderRadius: 'var(--radius-xl)',
                padding: '20px',
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 20px 40px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)',
                pointerEvents: 'auto',
              }}
            >
              {/* Close button */}
              <button
                onClick={e => { e.stopPropagation(); handleCloseDrawer(); }}
                aria-label="Close detail card"
                style={{
                  position: 'absolute', top: 16, right: 16,
                  width: 28, height: 28,
                  borderRadius: '50%',
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--glass-border)',
                  color: 'var(--text-secondary)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseOver={(e) => { e.currentTarget.style.color = 'white'; e.currentTarget.style.background = 'hsla(0,0%,100%,0.1)'; }}
                onMouseOut={(e) => { e.currentTarget.style.color = 'var(--text-secondary)'; e.currentTarget.style.background = 'var(--bg-elevated)'; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
                <div style={{
                  fontSize: '2rem',
                  background: 'var(--bg-elevated)',
                  padding: '12px',
                  borderRadius: '16px',
                  boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.3)',
                }}>
                  {activeZone.emoji}
                </div>
                <div style={{ paddingTop: 4 }}>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'white', lineHeight: 1.1 }}>
                    {activeZone.label}
                  </h3>
                  <p className="label-mono" style={{ fontSize: '0.75rem', marginTop: 4 }}>
                    {activeZone.sublabel}
                  </p>
                </div>
              </div>

              {/* Density Indicator */}
              <div style={{ marginBottom: 16, background: 'var(--bg-deep)', padding: '12px', borderRadius: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>Live Crowd Density</span>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: dColor }}>
                    {density}% — {dLevel}
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 3, background: 'var(--bg-void)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%',
                    width: getDensityBarWidth(density),
                    background: `linear-gradient(90deg, var(--brand-accent), ${dColor})`,
                    borderRadius: 3,
                    transition: 'width 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
                  }} />
                </div>
              </div>

              {/* Details */}
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: 16 }}>
                {activeZone.details}
              </p>

              {/* Action Button */}
              <button className="btn btn-primary" style={{ width: '100%', padding: '12px' }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 20l-5.447-2.724A2 2 0 013 15.382V5.618a2 2 0 011.106-1.789L9 4l6 3 5.447-2.724A2 2 0 0123 5.618v9.764a2 2 0 01-1.106 1.789L15 20l-6-3z" />
                  <path d="M9 4v16" />
                  <path d="M15 4v16" />
                </svg>
                Navigate Here
              </button>

            </div>
          );
        })()}
      </div>

      {/* ── Legend ── */}
      <div
        role="list"
        aria-label="Density colour legend"
        className="glass-card"
        style={{
          display: 'flex', gap: 20, flexShrink: 0,
          padding: '10px 24px',
          borderRadius: 99,
          flexWrap: 'wrap', justifyContent: 'center',
          marginTop: 'auto',
          zIndex: 1,
        }}
      >
        {([['#00E676','Low'],['#FFB300','Moderate'],['#FF5252','High']] as const).map(([color, label]) => (
          <div key={label} role="listitem" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: color, boxShadow: `0 0 8px ${color}` }} aria-hidden="true" />
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 600 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default memo(StadiumMap);
