import type { Metadata } from 'next';
import Link from 'next/link';
import ChatInterface from '@/components/ChatInterface';
import MapWrapper from '@/components/MapWrapper';

export const metadata: Metadata = {
  title: 'NexArena — Your Smart Venue Assistant',
  description:
    'Navigate your stadium with AI-powered assistance. Find restrooms, food courts, exits, and more in real-time.',
};

export default function FanPage() {
  const currentTime = new Date().toLocaleString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .fan-layout {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          max-width: 1440px;
          margin: 0 auto;
          padding: 0 16px 32px;
        }
        .fan-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
          flex: 1;
        }
        @media (min-width: 1024px) {
          .fan-grid {
            grid-template-columns: 1fr 420px;
            grid-template-rows: 1fr;
            min-height: 0;
          }
        }
        .map-panel {
          min-height: 320px;
          border-radius: var(--radius-xl);
          overflow: hidden;
          position: relative;
        }
        @media (min-width: 1024px) {
          .fan-layout {
            height: 100vh;
            overflow: hidden;
            padding-bottom: 24px;
          }
          .fan-grid {
            flex: 1;
            min-height: 0;
          }
          .map-panel {
            min-height: unset;
            height: 100%;
          }
        }
        .stat-card {
          flex: 1;
          padding: 14px 16px;
          border-radius: var(--radius-md);
          background: var(--bg-elevated);
          border: 1px solid var(--glass-border);
          min-width: 0;
        }
      `}</style>

      <div className="fan-layout">
        {/* ── Top navigation bar ── */}
        <header
          role="banner"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 0 24px',
            gap: 16,
            flexShrink: 0,
          }}
        >
          {/* Logo & Title */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div
              aria-hidden="true"
              style={{
                width: 44,
                height: 44,
                borderRadius: 12,
                background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.4rem',
                boxShadow: 'var(--glow-primary)',
                flexShrink: 0,
              }}
            >
              🏟️
            </div>
            <div>
              <h1
                className="text-gradient"
                style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.02em' }}
              >
                NexArena
              </h1>
              <p className="label-mono" style={{ fontSize: '0.65rem' }}>Smart Venue Assistant</p>
            </div>
          </div>

          {/* Status bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
            <div
              className="glass-card hide-mobile"
              style={{ padding: '8px 16px', borderRadius: 'var(--radius-full)' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span className="status-dot status-live" aria-hidden="true" />
                <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>
                  Live Event
                </span>
              </div>
            </div>
            <Link
              href="/admin"
              className="btn btn-ghost"
              aria-label="Go to Admin Dashboard"
              style={{ padding: '8px 16px', fontSize: '0.8125rem' }}
            >
              ⚙️ Admin
            </Link>
          </div>
        </header>

        {/* ── Quick stats row ── */}
        <div
          role="region"
          aria-label="Venue quick stats"
          style={{
            display: 'flex',
            gap: 12,
            marginBottom: 20,
            flexShrink: 0,
          }}
        >
          <div className="stat-card">
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Attendance
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-primary)', fontFamily: 'var(--font-mono)' }}>
              42,816
            </p>
          </div>
          <div className="stat-card">
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Crowd Level
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-warning)', fontFamily: 'var(--font-mono)' }}>
              Moderate
            </p>
          </div>
          <div className="stat-card hide-mobile">
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Event Time
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
              Q3 08:42
            </p>
          </div>
          <div className="stat-card hide-mobile">
            <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              Wait: Food Court
            </p>
            <p style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--brand-accent)', fontFamily: 'var(--font-mono)' }}>
              ~4 min
            </p>
          </div>
        </div>

        {/* ── Main grid ── */}
        <div className="fan-grid">
          {/* Left: Stadium Map */}
          <section
            aria-label="Stadium zone map"
            className="glass-panel map-panel shine-border"
          >
            <MapWrapper />

            {/* Map legend overlay */}
            <div
              aria-label="Map zone legend"
              role="list"
              style={{
                position: 'absolute',
                bottom: 16,
                left: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
              }}
            >
              {[
                { color: '#3b82f6', label: 'Gate A' },
                { color: '#8b5cf6', label: 'Gate B' },
                { color: '#10b981', label: 'Food Court' },
                { color: '#f59e0b', label: 'Nearest Exit' },
              ].map(({ color, label }) => (
                <div
                  key={label}
                  role="listitem"
                  className="glass-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '5px 10px',
                    borderRadius: 'var(--radius-full)',
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: color,
                      boxShadow: `0 0 6px ${color}`,
                      flexShrink: 0,
                    }}
                  />
                  <span style={{ fontSize: '0.6875rem', fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </section>

          {/* Right: Chat Interface */}
          <section
            className="glass-panel"
            aria-label="AI chat assistant panel"
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: 500,
              overflow: 'hidden',
            }}
          >
            <ChatInterface />
          </section>
        </div>

        {/* ── Footer ── */}
        <footer
          role="contentinfo"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '20px 0 0',
            flexShrink: 0,
          }}
        >
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            © 2025 NexArena · Built for PromptWars Hackathon
          </p>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            <time dateTime={new Date().toISOString()}>{currentTime}</time>
          </p>
        </footer>
      </div>
    </>
  );
}
