'use client'

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html>
      <body>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui, sans-serif', background: '#111', color: '#fff' }}>
          <div style={{ textAlign: 'center', maxWidth: 400, padding: 24 }}>
            <h2 style={{ fontSize: 24, marginBottom: 8 }}>Something went wrong</h2>
            <p style={{ color: '#999', marginBottom: 24 }}>An unexpected error occurred. Please try again.</p>
            <button
              onClick={reset}
              style={{ padding: '10px 24px', background: '#3b82f6', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontSize: 14 }}
            >
              Try Again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}
