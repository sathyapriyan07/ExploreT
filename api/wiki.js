import { getCache, setCache } from './_lib/cache.js'
import { json, getClientIp, parseUrl } from './_lib/http.js'
import { rateLimit } from './_lib/rateLimit.js'
import { wikiSummary } from './_lib/wiki.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const ip = getClientIp(req)
  const rl = rateLimit({ key: `wiki:${ip}`, limit: 180, windowMs: 60_000 })
  if (!rl.ok) return json(res, 429, { error: 'Rate limit exceeded' })

  res.setHeader('cache-control', 'public, max-age=300, s-maxage=3600')

  const url = parseUrl(req)
  const place = (url.searchParams.get('place') || '').trim()
  if (!place) return json(res, 400, { error: 'Missing place' })

  const cacheKey = `wiki:${place.toLowerCase()}`
  const cached = getCache(cacheKey)
  if (cached) return json(res, 200, cached)

  try {
    const data = await wikiSummary(place)
    return json(res, 200, setCache(cacheKey, data, 6 * 60 * 60_000))
  } catch (e) {
    return json(res, 502, { error: e instanceof Error ? e.message : 'Upstream error' })
  }
}
