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
    const isIOS = /iPhone|iPad|iPod/i.test(ua)
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
      } else if (isIOS) {
        // iOS (including Messenger WebView): cannot reliably force Safari.
        // Try a few strategies; if blocked, the UI below provides manual actions.
        // 1) Try opening in a new tab (may still stay in in-app browser)
        const w = window.open(target, '_blank')
        if (!w) {
          // 2) Try replacing top location
          try { window.top?.location.replace(target) } catch {}
          // 3) Final attempt: direct navigation
          setTimeout(() => { window.location.href = target }, 50)
        }
      } else {
        // Others: try _top navigation which often triggers "Open in browser"
        window.location.replace(target)
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
      <h1 style={{ fontSize: 18, marginBottom: 12 }}>Đang mở liên kết…</h1>
      {!target ? (
        <p>Thiếu URL đích.</p>
      ) : (
        <div style={{ lineHeight: 1.6 }}>
          <p>Nếu không tự động mở, bạn có thể:</p>
          <ol style={{ margin: '8px 0 12px 16px' }}>
            <li>- Chạm vào nút bên dưới để mở liên kết.</li>
            <li>- Hoặc giữ (long-press) vào liên kết và chọn “Open in Safari”.</li>
            <li>- Hoặc sao chép liên kết và mở bằng Safari.</li>
          </ol>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <a
              href={target}
              target="_blank"
              rel="noopener noreferrer external"
              style={{
                background: '#f7b500', color: '#000', padding: '10px 14px', borderRadius: 8,
                textDecoration: 'none', fontWeight: 600
              }}
            >Mở liên kết</a>
            <button
              onClick={() => { try { navigator.clipboard.writeText(target) } catch {} }}
              style={{
                background: '#1f2937', color: '#fff', padding: '10px 14px', borderRadius: 8,
                border: '1px solid #374151'
              }}
            >Sao chép liên kết</button>
          </div>
          <div style={{ marginTop: 12, wordBreak: 'break-all', fontFamily: 'monospace', fontSize: 12, opacity: 0.8 }}>
            {target}
          </div>
        </div>
      )}
    </div>
  )
}

