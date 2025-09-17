import type { NextApiRequest, NextApiResponse } from 'next'

// Server-side redirect to Transak widget to ensure consistent Referer and reduce WAF denials.
// Accepts query: mode=INR|USDT, amount (INR), amountUsdt (USDT), address (wallet)
export default function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const { mode, amount, amountUsdt, address } = req.query

    const addr = String(address || '').trim()
    if (!addr) {
      return res.status(400).json({ error: 'Missing wallet address' })
    }

    const params = new URLSearchParams()
    params.set('cryptoCurrencyCode', 'USDT')
    params.set('defaultNetwork', 'bsc')
    params.set('defaultFiatCurrency', 'INR')
    params.set('walletAddress', addr)

    const m = String(mode || 'INR').toUpperCase()
    if (m === 'INR') {
      const amt = Number(String(amount || '').trim())
      if (!Number.isFinite(amt) || amt <= 0) {
        return res.status(400).json({ error: 'Invalid INR amount' })
      }
      params.set('defaultFiatAmount', String(amt))
    } else if (m === 'USDT') {
      // Minimal params; let the user input amount on Transak widget
      // If you want to prefill crypto amount and it works for your account, uncomment next line:
      // const a = Number(String(amountUsdt || '').trim()); if (Number.isFinite(a) && a > 0) params.set('cryptoAmount', String(a));
    }

    const location = `https://global.transak.com/?${params.toString()}`
    res.writeHead(302, {
      Location: location,
      // Helpful to reduce caching of redirects
      'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
      Pragma: 'no-cache',
      Expires: '0',
    })
    res.end()
  } catch (e: any) {
    res.status(500).json({ error: e?.message || 'Internal error' })
  }
}
