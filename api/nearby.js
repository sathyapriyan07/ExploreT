import { getCache, setCache } from './_lib/cache.js'
import { json, getClientIp, parseUrl } from './_lib/http.js'
import { rateLimit } from './_lib/rateLimit.js'
import { nearbyPois } from './_lib/overpass.js'

export default async function handler(req, res) {
  if (req.method !== 'GET') return json(res, 405, { error: 'Method not allowed' })

  const ip = getClientIp(req)
  const rl = rateLimit({ key: `nearby:${ip}`, limit: 120, windowMs: 60_000 })
  if (!rl.ok) return json(res, 429, { error: 'Rate limit exceeded' })

  res.setHeader('cache-control', 'public, max-age=300, s-maxage=3600')

  const url = parseUrl(req)
  const lat = Number(url.searchParams.get('lat'))
  const lon = Number(url.searchParams.get('lon'))
  const radius = Number(url.searchParams.get('radius') || 4500)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return json(res, 400, { error: 'Missing lat/lon' })
  }

  const cacheKey = `nearby:${lat.toFixed(3)}:${lon.toFixed(3)}:${Math.round(radius)}`
  const cached = getCache(cacheKey)
  if (cached) return json(res, 200, cached)

  try {
    const data = await nearbyPois(lat, lon, radius)
    return json(res, 200, setCache(cacheKey, data, 6 * 60 * 60_000))
  } catch (e) {
    return json(res, 502, { error: e instanceof Error ? e.message : 'Upstream error' })
  }
}
