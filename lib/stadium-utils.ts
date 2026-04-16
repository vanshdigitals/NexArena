/**
 * lib/stadium-utils.ts
 *
 * Pure helper functions and static configuration for the stadium map.
 * Extracted from StadiumMap.tsx so they can be independently unit-tested
 * without requiring a browser/DOM environment.
 */

import type { ZoneDensity } from './firestore';

// ── Types ──────────────────────────────────────────────────────────────────

export interface ZoneConfig {
  firestoreField: keyof Omit<ZoneDensity, 'updatedAt'>;
  id: string;
  label: string;
  sublabel: string;
  accentColor: string;
  cx: number;
  cy: number;
  textAnchor: 'start' | 'middle' | 'end';
  textX: number;
  textY: number;
  defaultDensity: number;
  details: string;
  emoji: string;
  directions: string;
}

export type DensityLevel = 'Low' | 'Moderate' | 'High';

// ── Static zone config ──────────────────────────────────────────────────

export const ZONES: ZoneConfig[] = [
  {
    id: 'gate-a',
    firestoreField: 'gateA',
    label: 'Gate A',
    sublabel: 'North Entrance',
    accentColor: '#3b82f6',
    cx: 200, cy: 36,
    textAnchor: 'middle', textX: 200, textY: 22,
    defaultDensity: 45,
    details: 'Main north entrance operations running normally. 3 security lanes currently open.',
    emoji: '\u{1F535}',
    directions: 'Head North towards the main plaza.',
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
    details: 'Heavy traffic at the South Entrance. Please consider using Gate A if possible.',
    emoji: '\u{1F7E3}',
    directions: 'Head South near the transit station.',
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
    details: 'All stalls open. Try the new artisanal burgers at Stall 4!',
    emoji: '\u{1F354}',
    directions: 'Located on the West side of the main concourse.',
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
    details: 'East emergency exit is clear. Fastest route out of the stadium currently.',
    emoji: '\u{1F6AA}',
    directions: 'East side stairs leading directly to street level.',
  },
];

// ── Density helpers ────────────────────────────────────────────────────────

/**
 * Map a density percentage (0-100) to a human-readable level label.
 *
 * @param v - Density percentage (0-100)
 * @returns 'Low' (< 40), 'Moderate' (40-69), or 'High' (≥ 70)
 */
export function getDensityLevel(v: number): DensityLevel {
  if (v < 40) return 'Low';
  if (v < 70) return 'Moderate';
  return 'High';
}

/**
 * Map a density percentage to a hex colour code for visual indicators.
 *
 * @param v - Density percentage (0-100)
 * @returns Green (#00E676), Amber (#FFB300), or Red (#FF5252)
 */
export function getDensityColor(v: number): string {
  if (v < 40) return '#00E676'; // green
  if (v < 70) return '#FFB300'; // amber
  return '#FF5252';             // red
}

/**
 * Map a density percentage to a CSS animation class for SVG marker pulses.
 *
 * @param v - Density percentage (0-100)
 * @returns CSS class name controlling pulse speed
 */
export function getDensityPulseClass(v: number): string {
  if (v < 40) return 'marker-pulse-low';
  if (v < 70) return 'marker-pulse-moderate';
  return 'marker-pulse-high';
}

/**
 * Convert a density value to a clamped CSS width string for progress bars.
 *
 * @param v - Density percentage (clamped to 0-100)
 * @returns CSS percentage string (e.g. '45%')
 */
export function getDensityBarWidth(v: number): string {
  return `${Math.min(100, Math.max(0, v))}%`;
}
