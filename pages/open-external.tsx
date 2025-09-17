import { useEffect } from 'react'
import { useRouter } from 'next/router'

// Attempt to break out of in-app browsers (Messenger) and open in default browser
export default function OpenExternal() {
  const router = useRouter()
  const target = typeof router.query.target === 'string' ? router.query.target : ''

  useEffect(() => {
    if (!target) return
    // On Android, try intent URL to force external browser
    const ua = navigator.userAgent || ''
    const isAndroid = /Android/i.test(ua)
    try {
      if (isAndroid && target.startsWith('http')) {
        // intent scheme fallback
        const intentUrl = `intent://${target.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`
        // Try opening intent first
        const w = window.open(intentUrl, '_top')
        if (!w) {
          // Fallback to normal open
          window.location.href = target
        }
      } else {
        // iOS and others: try _top navigation which often triggers "Open in browser"
        window.location.href = target
      }
    } catch {
      // Final fallback: show a simple page with a manual link
      setTimeout(() => {
        window.location.href = target
      }, 50)
    }
  }, [target])

  return (
    <div style={{ padding: 24, color: 'white', background: '#0b0f1a', minHeight: '100vh' }}>
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Opening in your browser…</h1>
      {!target ? (
        <p>Missing target URL.</p>
      ) : (
        <p>
          If nothing happens, <a href={target} style={{ color: '#f7b500', textDecoration: 'underline' }}>tap here</a> to open in your browser.
        </p>
      )}
    </div>
  )
}
