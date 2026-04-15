/**
 * @jest-environment node
 *
 * Tests for lib/stadium-utils.ts — pure stadium helper functions & config.
 */

import {
  getDensityLevel,
  getDensityColor,
  getDensityPulseClass,
  getDensityBarWidth,
  ZONES,
  type ZoneConfig,
  type DensityLevel,
} from '@/lib/stadium-utils';

/* ── getDensityLevel ─────────────────────────────────────────────────── */

describe('getDensityLevel', () => {
  it.each<[number, DensityLevel]>([
    [0, 'Low'],
    [10, 'Low'],
    [39, 'Low'],
    [40, 'Moderate'],
    [55, 'Moderate'],
    [69, 'Moderate'],
    [70, 'High'],
    [85, 'High'],
    [100, 'High'],
  ])('returns "%s" → "%s"', (value, expected) => {
    expect(getDensityLevel(value)).toBe(expected);
  });
});

/* ── getDensityColor ─────────────────────────────────────────────────── */

describe('getDensityColor', () => {
  it('returns green (#00E676) for low density', () => {
    expect(getDensityColor(0)).toBe('#00E676');
    expect(getDensityColor(20)).toBe('#00E676');
    expect(getDensityColor(39)).toBe('#00E676');
  });

  it('returns amber (#FFB300) for moderate density', () => {
    expect(getDensityColor(40)).toBe('#FFB300');
    expect(getDensityColor(55)).toBe('#FFB300');
    expect(getDensityColor(69)).toBe('#FFB300');
  });

  it('returns red (#FF5252) for high density', () => {
    expect(getDensityColor(70)).toBe('#FF5252');
    expect(getDensityColor(85)).toBe('#FF5252');
    expect(getDensityColor(100)).toBe('#FF5252');
  });
});

/* ── getDensityPulseClass ───────────────────────────────────────────── */

describe('getDensityPulseClass', () => {
  it('returns marker-pulse-low for < 40', () => {
    expect(getDensityPulseClass(10)).toBe('marker-pulse-low');
  });

  it('returns marker-pulse-moderate for 40-69', () => {
    expect(getDensityPulseClass(50)).toBe('marker-pulse-moderate');
  });

  it('returns marker-pulse-high for >= 70', () => {
    expect(getDensityPulseClass(90)).toBe('marker-pulse-high');
  });
});

/* ── getDensityBarWidth ──────────────────────────────────────────────── */

describe('getDensityBarWidth', () => {
  it('returns percentage string', () => {
    expect(getDensityBarWidth(50)).toBe('50%');
  });

  it('clamps to 0% minimum', () => {
    expect(getDensityBarWidth(-10)).toBe('0%');
  });

  it('clamps to 100% maximum', () => {
    expect(getDensityBarWidth(150)).toBe('100%');
  });

  it('handles boundary values', () => {
    expect(getDensityBarWidth(0)).toBe('0%');
    expect(getDensityBarWidth(100)).toBe('100%');
  });
});

/* ── ZONES config integrity ──────────────────────────────────────────── */

describe('ZONES configuration', () => {
  it('has exactly 4 zones defined', () => {
    expect(ZONES).toHaveLength(4);
  });

  it('all zones have unique IDs', () => {
    const ids = ZONES.map(z => z.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all zones have unique firestoreField mappings', () => {
    const fields = ZONES.map(z => z.firestoreField);
    expect(new Set(fields).size).toBe(fields.length);
  });

  it('all zones have required properties', () => {
    const requiredKeys: (keyof ZoneConfig)[] = [
      'id', 'firestoreField', 'label', 'sublabel', 'accentColor',
      'cx', 'cy', 'textAnchor', 'textX', 'textY',
      'defaultDensity', 'details', 'emoji', 'directions',
    ];

    for (const zone of ZONES) {
      for (const key of requiredKeys) {
        expect(zone[key]).toBeDefined();
      }
    }
  });

  it('all zones have defaultDensity between 0 and 100', () => {
    for (const zone of ZONES) {
      expect(zone.defaultDensity).toBeGreaterThanOrEqual(0);
      expect(zone.defaultDensity).toBeLessThanOrEqual(100);
    }
  });

  it('textAnchor values are valid SVG values', () => {
    const validAnchors = ['start', 'middle', 'end'];
    for (const zone of ZONES) {
      expect(validAnchors).toContain(zone.textAnchor);
    }
  });

  it('firestoreField values match ZoneDensity keys', () => {
    const validFields = ['gateA', 'gateB', 'foodCourt', 'sectionD'];
    for (const zone of ZONES) {
      expect(validFields).toContain(zone.firestoreField);
    }
  });
});
