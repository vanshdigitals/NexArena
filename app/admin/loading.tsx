/**
 * app/admin/loading.tsx
 *
 * Loading skeleton for the admin dashboard route.
 */
export default function AdminLoading() {
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
        <div
          aria-label="Loading admin dashboard"
          role="status"
          style={{
            width: 48,
            height: 48,
            border: '3px solid rgba(124,77,255,0.15)',
            borderTopColor: '#7C4DFF',
            borderRadius: '50%',
            animation: 'admin-spin 0.8s linear infinite',
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
          Loading Admin Dashboard&hellip;
        </p>
      </div>
      <style>{`
        @keyframes admin-spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
