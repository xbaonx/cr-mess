import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Attempt to break out of in-app browsers (Messenger) and open in default browser
export default function OpenExternal() {
  const router = useRouter()
  const target = typeof router.query.target === 'string' ? router.query.target : ''

  const handleOpen = () => {
    if (!target) return
    const ua = navigator.userAgent || ''
    const isAndroid = /Android/i.test(ua)
    if (isAndroid && target.startsWith('http')) {
      const intentUrl = `intent://${target.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
      window.location.href = intentUrl
      return
    }
    // iOS & others: mở tab mới (user gesture)
    window.open(target, '_blank', 'noopener,noreferrer')
  }

  return (
    <div style={{ padding: 24, color: 'white', background: '#0b0f1a', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Open link in your browser</h1>
      {!target ? (
        <p>Missing target URL.</p>
      ) : (
        <div style={{ lineHeight: 1.6 }}>
          <p>Tap the button below to confirm opening this link in your device browser.</p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 12 }}>
            <button
              onClick={handleOpen}
              style={{
                background: '#f7b500', color: '#000', padding: '10px 14px', borderRadius: 8,
                border: 0, fontWeight: 600
              }}
            >Open link</button>
            <button
              onClick={() => { try { navigator.clipboard.writeText(target) } catch {} }}
              style={{
                background: '#1f2937', color: '#fff', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #374151'
              }}
            >Copy link</button>
          </div>
          <div style={{ marginTop: 12, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12, opacity: 0.8 }}>
            {target}
          </div>
        </div>
      )}
    </div>
  )
}

