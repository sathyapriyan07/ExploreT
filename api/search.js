import { getCache, setCache } from './_lib/cache.js'
import { json, getClientIp, parseUrl } from './_lib/http.js'
import { rateLimit } from './_lib/rateLimit.js'
import { wikiSearch } from './_lib/wiki.js'

const lastByIp = new Map()

function normalizeQuery(q) {
  return String(q || '')
    .trim()
    .replace(/\s+/g, ' ')
}

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const ip = getClientIp(req)
  const rl = rateLimit({ key: `search:${ip}`, limit: 180, windowMs: 60_000 })
  if (!rl.ok) return json(res, 429, { error: 'Rate limit exceeded' })

  res.setHeader('cache-control', 'public, max-age=120, s-maxage=1800')

  const url = parseUrl(req)
  const query = normalizeQuery(url.searchParams.get('query'))
  if (!query) return json(res, 200, [])
  if (query.length < 3) return json(res, 200, [])

  // Anti-spam: if client fires many requests while typing, return the last payload for this IP.
  const last = lastByIp.get(ip)
  if (last && Date.now() - last.at < 900) {
    res.setHeader('x-explorex-throttled', '1')
    return json(res, 200, last.data)
  }

  const cacheKey = `search:${query.toLowerCase()}`
  const cached = getCache(cacheKey)
  if (cached) {
    lastByIp.set(ip, { at: Date.now(), data: cached })
    return json(res, 200, cached)
  }

  // Prefix cache: for queries like "varkala bea..." reuse cached "varkala"
  const cut =
    query.includes(' ') ? query.slice(0, query.lastIndexOf(' ')).trim() : ''
  if (cut && cut.length >= 3) {
    const prefixKey = `search:${cut.toLowerCase()}`
    const prefix = getCache(prefixKey)
    if (prefix) {
      lastByIp.set(ip, { at: Date.now(), data: prefix })
      res.setHeader('x-explorex-prefix', cut)
      return json(res, 200, prefix)
    }
  }

  try {
    const data = await wikiSearch(query, 12)
    const cachedData = setCache(cacheKey, data, 60 * 60_000)
    lastByIp.set(ip, { at: Date.now(), data: cachedData })
    return json(res, 200, cachedData)
  } catch (e) {
    // Wikipedia may temporarily rate-limit (429). Prefer a graceful empty response over surfacing a hard error.
    const msg = e instanceof Error ? e.message : 'Upstream error'
    if (String(msg).includes('(429)')) {
      res.setHeader('x-upstream-rate-limited', '1')
      return json(res, 200, [])
    }
    return json(res, 502, { error: msg })
  }
}
