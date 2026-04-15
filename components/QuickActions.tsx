'use client';

import { memo } from 'react';

/**
 * QuickActions - Premium Edition
 * Chip buttons with soft backgrounds, gradients, and hover lifts.
 * Wrapped with React.memo for render optimisation.
 */

interface QuickActionsProps {
  onSelect: (prompt: string) => void;
  disabled?: boolean;
}

const QUICK_ACTIONS = [
  { id: 'qa-restroom',  emoji: '🚻', label: 'Find Restroom',   prompt: 'Where is the nearest restroom from my current section?'   },
  { id: 'qa-food',      emoji: '🍔', label: 'Food Court',      prompt: 'Show me the nearest food court and what\'s available there.' },
  { id: 'qa-exit',      emoji: '🚪', label: 'Nearest Exit',    prompt: 'What is the safest and quickest exit from the stadium?'   },
  { id: 'qa-parking',   emoji: '🅿️', label: 'Parking Info',   prompt: 'Where is the parking area and is there space available?'   },
  { id: 'qa-medical',   emoji: '🏥', label: 'Medical Aid',     prompt: 'Where is the nearest first aid or medical station?'        },
  { id: 'qa-seating',   emoji: '🎟️', label: 'My Seat',        prompt: 'Help me find block D, row 14, seat 22 in the stadium.'    },
] as const;

function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <div
      role="region"
      aria-label="Quick action suggestions"
      style={{
        display: 'flex',
        flexWrap: 'nowrap',
        gap: '10px',
        overflowX: 'auto',
        paddingBottom: 4,
        scrollbarWidth: 'thin',
      }}
    >
      {QUICK_ACTIONS.map(({ id, emoji, label, prompt }) => (
        <button
          key={id}
          id={id}
          className="btn-chip"
          onClick={() => { import('@/lib/analytics').then(({ logQuickActionUsed }) => logQuickActionUsed(label)); onSelect(prompt); }}
          disabled={disabled}
          aria-label={`Quick action: ${label}`}
          title={prompt}
          type="button"
          style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <span aria-hidden="true" style={{ fontSize: '1.1rem', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))' }}>{emoji}</span>
          {label}
        </button>
      ))}
    </div>
  );
}

export default memo(QuickActions);
