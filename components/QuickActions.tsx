'use client';

/**
 * QuickActions
 * Chip buttons for common fan queries. On click they pre-fill the
 * chat with the selected prompt, calling the onSelect callback.
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

export default function QuickActions({ onSelect, disabled = false }: QuickActionsProps) {
  return (
    <section aria-label="Quick action shortcuts">
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: '8px',
        }}
      >
        {QUICK_ACTIONS.map(({ id, emoji, label, prompt }) => (
          <button
            key={id}
            id={id}
            className="btn-chip"
            onClick={() => onSelect(prompt)}
            disabled={disabled}
            aria-label={`Quick action: ${label}`}
            title={prompt}
            type="button"
          >
            <span aria-hidden="true">{emoji}</span>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
