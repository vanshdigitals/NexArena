'use client';

import { useState, useTransition } from 'react';

/**
 * Zone density level colour thresholds.
 */
function getDensityColor(value: number): string {
  if (value < 40) return 'hsl(168,84%,52%)';   // green  – low
  if (value < 70) return 'hsl(38,92%,58%)';    // amber  – medium
  return 'hsl(0,84%,60%)';                      // red    – high
}

function getDensityLabel(value: number): string {
  if (value < 40) return 'Low';
  if (value < 70) return 'Moderate';
  return 'High';
}

interface Zone {
  id: string;
  name: string;
  emoji: string;
  capacity: number;
  firestoreField: string;
}

const ZONES: Zone[] = [
  { id: 'gate-a',     name: 'Gate A',      emoji: '🅰️',  capacity: 100, firestoreField: 'gateA'     },
  { id: 'gate-b',     name: 'Gate B',      emoji: '🅱️',  capacity: 100, firestoreField: 'gateB'     },
  { id: 'food-court', name: 'Food Court',  emoji: '🍔',  capacity: 100, firestoreField: 'foodCourt' },
  { id: 'section-d',  name: 'Section D',   emoji: '🎯',  capacity: 100, firestoreField: 'sectionD'  },
];

interface ZoneSliderProps {
  onUpdate?: (field: string, value: number) => Promise<void>;
}

/**
 * ZoneSlider
 * Admin controls for adjusting density per stadium zone.
 * Calls onUpdate which should write to Firestore.
 */
export default function ZoneSlider({ onUpdate }: ZoneSliderProps) {
  const [values, setValues] = useState<Record<string, number>>({
    gateA: 45, gateB: 72, foodCourt: 88, sectionD: 30,
  });
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [saved, setSaved] = useState<Record<string, boolean>>({});
  const [, startTransition] = useTransition();

  const handleChange = (field: string, value: number) => {
    setValues(prev => ({ ...prev, [field]: value }));
  };

  const handleCommit = async (field: string, value: number) => {
    setSaving(prev => ({ ...prev, [field]: true }));
    setSaved(prev => ({ ...prev, [field]: false }));

    try {
      if (onUpdate) {
        await onUpdate(field, value);
      } else {
        // Simulate Firestore write latency in demo mode
        await new Promise(res => setTimeout(res, 500));
      }
      startTransition(() => {
        setSaved(prev => ({ ...prev, [field]: true }));
        setTimeout(() => setSaved(prev => ({ ...prev, [field]: false })), 2000);
      });
    } catch {
      // Silent – in real app show toast
    } finally {
      setSaving(prev => ({ ...prev, [field]: false }));
    }
  };

  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}
      aria-label="Zone density controls"
    >
      {ZONES.map(zone => {
        const value = values[zone.firestoreField] ?? 0;
        const color = getDensityColor(value);
        const label = getDensityLabel(value);
        const isSaving = saving[zone.firestoreField];
        const isSaved  = saved[zone.firestoreField];

        return (
          <div key={zone.id}>
            {/* Zone header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden="true" style={{ fontSize: '1.25rem' }}>{zone.emoji}</span>
                <div>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                    {zone.name}
                  </p>
                  <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 1 }}>
                    Firestore: <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-accent)' }}>zones/{zone.firestoreField}</code>
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                {isSaving && (
                  <span role="status" aria-label="Saving to Firestore" style={{ fontSize: '0.75rem', color: 'var(--brand-primary)' }}>
                    Saving…
                  </span>
                )}
                {isSaved && (
                  <span role="status" aria-label="Saved to Firestore" style={{ fontSize: '0.75rem', color: 'var(--brand-accent)' }}>
                    ✓ Synced
                  </span>
                )}
                <span
                  aria-label={`${zone.name} density: ${value}% — ${label}`}
                  style={{
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    fontFamily: 'var(--font-mono)',
                    color,
                    minWidth: 44,
                    textAlign: 'right',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {value}%
                </span>
              </div>
            </div>

            {/* Density bar */}
            <div
              aria-hidden="true"
              style={{
                height: 4,
                borderRadius: 2,
                background: 'var(--bg-elevated)',
                marginBottom: 10,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${value}%`,
                  background: `linear-gradient(90deg, hsl(168,84%,52%), ${color})`,
                  borderRadius: 2,
                  transition: 'width 0.2s ease, background 0.3s ease',
                }}
              />
            </div>

            {/* Slider */}
            <input
              id={`slider-${zone.id}`}
              type="range"
              className="zone-slider"
              min={0}
              max={100}
              step={1}
              value={value}
              onChange={e => handleChange(zone.firestoreField, parseInt(e.target.value))}
              onMouseUp={e => handleCommit(zone.firestoreField, parseInt((e.target as HTMLInputElement).value))}
              onTouchEnd={e => handleCommit(zone.firestoreField, parseInt((e.target as HTMLInputElement).value))}
              aria-label={`${zone.name} crowd density — currently ${value}%, level: ${label}`}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
              aria-valuetext={`${value}% — ${label}`}
              style={{
                background: `linear-gradient(to right, ${color} ${value}%, var(--bg-elevated) ${value}%)`,
              }}
            />

            {/* Density labels */}
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: '0.6875rem', color: 'hsl(168,84%,52%)' }}>Low</span>
              <span
                style={{
                  fontSize: '0.6875rem',
                  fontWeight: 700,
                  color,
                  transition: 'color 0.3s ease',
                }}
              >
                {label}
              </span>
              <span style={{ fontSize: '0.6875rem', color: 'hsl(0,84%,60%)' }}>High</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
