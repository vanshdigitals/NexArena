/**
 * app/loading.tsx
 *
 * Next.js loading skeleton — displayed automatically while route segments
 * are being fetched or lazily loaded. Uses the NexArena design tokens
 * for a seamless visual transition.
 */
export default function Loading() {
  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#060918',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        {/* Spinning ring loader */}
        <div
          aria-label="Loading NexArena"
          role="status"
          style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(0,229,255,0.12)',
            borderTopColor: '#00E5FF',
            borderRadius: '50%',
            animation: 'nexarena-spin 0.8s linear infinite',
            margin: '0 auto 16px',
          }}
        />
        <p
          style={{
            color: 'rgba(240,244,255,0.4)',
            fontSize: '0.875rem',
            fontWeight: 500,
            fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
          }}
        >
          Loading NexArena&hellip;
        </p>
      </div>
      <style>{`
        @keyframes nexarena-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
