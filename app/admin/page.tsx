import type { Metadata } from 'next';
import Link from 'next/link';
import ZoneSlider from '@/components/ZoneSlider';

export const metadata: Metadata = {
  title: 'Admin Dashboard — NexArena',
  description: 'Operator control center for managing NexArena venue crowd density and alerts.',
  robots: 'noindex, nofollow', // Keep admin out of search engines
};

export default function AdminPage() {
  return (
    <>
      <style>{`
        .admin-layout {
          min-height: 100vh;
          max-width: 1280px;
          margin: 0 auto;
          padding: 0 16px 48px;
        }
        .admin-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 24px;
        }
        @media (min-width: 900px) {
          .admin-grid {
            grid-template-columns: 1fr 360px;
          }
        }
        .metric-bar {
          position: relative;
          height: 6px;
          background: var(--bg-elevated);
          border-radius: 3px;
          overflow: hidden;
        }
        .metric-fill {
          height: 100%;
          border-radius: 3px;
          transition: width 0.5s ease;
        }
      `}</style>

      <div className="admin-layout">
        {/* ── Header ── */}
        <header
          role="banner"
          style={{
            padding: '24px 0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            borderBottom: '1px solid var(--glass-border)',
            marginBottom: 32,
            flexWrap: 'wrap',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link
              href="/"
              aria-label="Back to Fan View"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 40,
                height: 40,
                borderRadius: 10,
                background: 'var(--bg-elevated)',
                border: '1px solid var(--glass-border)',
                color: 'var(--text-secondary)',
                fontSize: '1.1rem',
                textDecoration: 'none',
                transition: 'all 0.2s ease',
                flexShrink: 0,
              }}
              className="back-btn"
            >
              ←
            </Link>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
                <h1
                  className="text-gradient"
                  style={{ fontSize: 'clamp(1.25rem, 3vw, 1.75rem)', fontWeight: 800, letterSpacing: '-0.02em' }}
                >
                  NexArena Ops
                </h1>
                <span className="section-badge">Admin</span>
              </div>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Real-time venue management · NexArena Command Center
              </p>
            </div>
          </div>

          {/* Admin header actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div className="glass-card" style={{ padding: '10px 16px', borderRadius: 'var(--radius-full)', display: 'flex', alignItems: 'center', gap: 8 }}>
              <span className="status-dot status-live" aria-hidden="true" />
              <span style={{ fontSize: '0.8125rem', color: 'var(--brand-accent)', fontWeight: 600 }}>
                Firestore Connected
              </span>
            </div>
            <button
              id="admin-sign-out-btn"
              className="btn btn-ghost"
              type="button"
              aria-label="Sign out of admin dashboard"
              style={{ fontSize: '0.8125rem', padding: '8px 16px' }}
            >
              Sign Out
            </button>
          </div>
        </header>

        <div className="admin-grid">
          {/* ── Left column: Zone density controls ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Zone Density Panel */}
            <section
              className="glass-panel"
              aria-labelledby="zone-density-title"
              style={{ padding: '28px 28px 32px' }}
            >
              <div style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span aria-hidden="true" style={{ fontSize: '1.4rem' }}>📊</span>
                  <h2
                    id="zone-density-title"
                    className="heading-section"
                  >
                    Zone Crowd Density
                  </h2>
                </div>
                <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Drag each slider to update crowd density. Changes sync to{' '}
                  <code style={{ fontFamily: 'var(--font-mono)', color: 'var(--brand-accent)', fontSize: '0.8125rem' }}>
                    Firestore/zones/current
                  </code>{' '}
                  in real-time and are reflected in the fan-facing app instantly.
                </p>

                {/* Firestore write indicator */}
                <div
                  aria-label="Firebase Firestore real-time sync indicator"
                  style={{
                    marginTop: 16,
                    padding: '10px 14px',
                    background: 'hsla(168,84%,52%,0.08)',
                    border: '1px solid hsla(168,84%,52%,0.2)',
                    borderRadius: 'var(--radius-md)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span aria-hidden="true" style={{ fontSize: '1rem' }}>🔥</span>
                  <div>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'hsl(168,84%,62%)', marginBottom: 2 }}>
                      Firebase Firestore Integration Active
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      Slider changes trigger <code style={{ fontFamily: 'var(--font-mono)' }}>setDoc()</code> with <code style={{ fontFamily: 'var(--font-mono)' }}>serverTimestamp()</code>
                    </p>
                  </div>
                </div>
              </div>

              <ZoneSlider />
            </section>

            {/* Alert Panel */}
            <section
              className="glass-panel"
              aria-labelledby="alerts-title"
              style={{ padding: '24px 28px' }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, gap: 12, flexWrap: 'wrap' }}>
                <h2 id="alerts-title" className="heading-section" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span aria-hidden="true">🚨</span> Active Alerts
                </h2>
                <button
                  id="admin-new-alert-btn"
                  type="button"
                  className="btn btn-primary"
                  aria-label="Create a new venue alert"
                  style={{ fontSize: '0.8125rem', padding: '8px 18px' }}
                >
                  + New Alert
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="list" aria-label="Current venue alerts">
                {[
                  { id: 'alert-1', severity: 'warning', zone: 'Food Court',  message: 'High crowd density — expect 8-10 min wait',         color: 'var(--brand-warning)' },
                  { id: 'alert-2', severity: 'info',    zone: 'Gate A',      message: 'Gates opening 30 min early tonight',                 color: 'var(--brand-primary)' },
                  { id: 'alert-3', severity: 'critical', zone: 'Section D', message: 'Medical team dispatched — area temporarily closed',   color: 'var(--brand-danger)'  },
                ].map(alert => (
                  <div
                    key={alert.id}
                    id={alert.id}
                    role="listitem"
                    className="glass-card"
                    aria-label={`${alert.severity} alert for ${alert.zone}: ${alert.message}`}
                    style={{
                      padding: '14px 16px',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 12,
                      borderLeft: `3px solid ${alert.color}`,
                      borderRadius: 'var(--radius-md)',
                    }}
                  >
                    <span
                      aria-hidden="true"
                      style={{
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: alert.color,
                        fontFamily: 'var(--font-mono)',
                        textTransform: 'uppercase',
                        paddingTop: 2,
                        letterSpacing: '0.08em',
                        flexShrink: 0,
                        minWidth: 56,
                      }}
                    >
                      {alert.severity}
                    </span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginBottom: 3 }}>
                        Zone: <strong style={{ color: 'var(--text-secondary)' }}>{alert.zone}</strong>
                      </p>
                      <p style={{ fontSize: '0.875rem', color: 'var(--text-primary)' }}>{alert.message}</p>
                    </div>
                    <button
                      id={`dismiss-${alert.id}`}
                      type="button"
                      className="btn btn-ghost"
                      aria-label={`Dismiss alert: ${alert.message}`}
                      style={{ padding: '4px 10px', fontSize: '0.75rem', flexShrink: 0 }}
                    >
                      Dismiss
                    </button>
                  </div>
                ))}
              </div>
            </section>
          </div>

          {/* ── Right column: Status & Auth ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Live metrics */}
            <section
              className="glass-panel"
              aria-labelledby="metrics-title"
              style={{ padding: '24px' }}
            >
              <h2 id="metrics-title" className="heading-section" style={{ marginBottom: 20, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden="true">📈</span> Live Metrics
              </h2>

              {[
                { label: 'Total Capacity Used',  value: 87, color: 'var(--brand-danger)'   },
                { label: 'Food Court Efficiency', value: 62, color: 'var(--brand-warning)'  },
                { label: 'Exit Flow Rate',         value: 40, color: 'var(--brand-primary)'  },
                { label: 'AI Chat Satisfaction',   value: 94, color: 'var(--brand-accent)'   },
              ].map(({ label, value, color }) => (
                <div key={label} style={{ marginBottom: 18 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', fontWeight: 500 }}>{label}</span>
                    <span
                      aria-label={`${label}: ${value}%`}
                      style={{ fontSize: '0.8125rem', fontWeight: 800, color, fontFamily: 'var(--font-mono)' }}
                    >
                      {value}%
                    </span>
                  </div>
                  <div
                    className="metric-bar"
                    role="progressbar"
                    aria-valuenow={value}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${label}: ${value}%`}
                  >
                    <div
                      className="metric-fill"
                      style={{ width: `${value}%`, background: color }}
                      aria-hidden="true"
                    />
                  </div>
                </div>
              ))}
            </section>

            {/* Google Auth card */}
            <section
              className="glass-panel"
              aria-labelledby="auth-title"
              style={{ padding: '24px' }}
            >
              <h2 id="auth-title" className="heading-section" style={{ marginBottom: 6, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden="true">🔐</span> Authentication
              </h2>
              <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', marginBottom: 20, lineHeight: 1.6 }}>
                Admin access is protected by Firebase Authentication with Google Sign-In.
              </p>

              <div
                style={{
                  padding: '16px',
                  background: 'var(--bg-elevated)',
                  borderRadius: 'var(--radius-md)',
                  marginBottom: 16,
                }}
                aria-label="Current signed-in user info"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div
                    aria-hidden="true"
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: '50%',
                      background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-secondary))',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '1.1rem',
                      flexShrink: 0,
                    }}
                  >
                    👤
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 600, fontSize: '0.9375rem', color: 'var(--text-primary)' }}>
                      Venue Operator
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      operator@nexarena.com
                    </p>
                  </div>
                </div>
              </div>

              <button
                id="admin-google-signin-btn"
                type="button"
                className="btn btn-primary"
                aria-label="Sign in with Google to access admin features"
                style={{ width: '100%', justifyContent: 'center', gap: 10 }}
              >
                <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Sign in with Google
              </button>

              <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted)', marginTop: 12, textAlign: 'center' }}>
                Protected by Firebase Auth · Admin roles verified server-side
              </p>
            </section>

            {/* System status */}
            <section
              className="glass-panel"
              aria-labelledby="system-title"
              style={{ padding: '24px' }}
            >
              <h2 id="system-title" className="heading-section" style={{ marginBottom: 16, display: 'flex', alignItems: 'center', gap: 10 }}>
                <span aria-hidden="true">🖥️</span> System Status
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }} role="list" aria-label="Service statuses">
                {[
                  { service: 'Firebase Firestore', status: 'Operational', dot: 'status-live'    },
                  { service: 'Gemini AI API',      status: 'Operational', dot: 'status-live'    },
                  { service: 'Google Maps API',     status: 'Not configured', dot: 'status-warning' },
                  { service: 'Google Auth',         status: 'Operational', dot: 'status-live'    },
                ].map(item => (
                  <div
                    key={item.service}
                    role="listitem"
                    style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}
                    aria-label={`${item.service}: ${item.status}`}
                  >
                    <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>{item.service}</span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span className={`status-dot ${item.dot}`} aria-hidden="true" />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: item.dot === 'status-live' ? 'var(--brand-accent)' : 'var(--brand-warning)' }}>
                        {item.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </>
  );
}
