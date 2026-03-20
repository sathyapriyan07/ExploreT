import { fetchWithTimeout } from './http.js'

const OVERPASS = 'https://overpass-api.de/api/interpreter'

function normalize(el) {
  const lat =
    typeof el.lat === 'number'
      ? el.lat
      : typeof el.center?.lat === 'number'
        ? el.center.lat
        : null
  const lon =
    typeof el.lon === 'number'
      ? el.lon
      : typeof el.center?.lon === 'number'
        ? el.center.lon
        : null
  if (lat === null || lon === null) return null
  return {
    id: el.id,
    type: el.type,
    lat,
    lon,
    name: typeof el.tags?.name === 'string' ? el.tags.name : null,
    tags: el.tags ?? null,
  }
}

export async function nearbyPois(lat, lon, radiusMeters = 4500) {
  const r = Math.max(500, Math.min(20000, Number(radiusMeters) || 4500))
  const q = `
[out:json][timeout:25];
(
  node["tourism"~"^(attraction|museum|viewpoint)$"](around:${r},${lat},${lon});
  way["tourism"~"^(attraction|museum|viewpoint)$"](around:${r},${lat},${lon});
  relation["tourism"~"^(attraction|museum|viewpoint)$"](around:${r},${lat},${lon});

  node["historic"](around:${r},${lat},${lon});
  way["historic"](around:${r},${lat},${lon});
  relation["historic"](around:${r},${lat},${lon});

  node["leisure"="park"](around:${r},${lat},${lon});
  way["leisure"="park"](around:${r},${lat},${lon});
  relation["leisure"="park"](around:${r},${lat},${lon});

  node["amenity"="place_of_worship"](around:${r},${lat},${lon});
  way["amenity"="place_of_worship"](around:${r},${lat},${lon});
  relation["amenity"="place_of_worship"](around:${r},${lat},${lon});
);
out center 80;`

  const res = await fetchWithTimeout(
    OVERPASS,
    {
      method: 'POST',
      headers: {
        'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
      },
      body: `data=${encodeURIComponent(q)}`,
    },
    20000,
  )
  if (!res.ok) throw new Error(`Overpass failed (${res.status})`)
  const data = await res.json()
  const elements = Array.isArray(data?.elements) ? data.elements : []
  return elements.map(normalize).filter(Boolean)
}

