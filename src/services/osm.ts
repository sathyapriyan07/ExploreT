export type OSMElement = {
  id: number
  type: 'node' | 'way' | 'relation'
  lat: number
  lon: number
  name?: string
  tags?: Record<string, string>
}

const OVERPASS = 'https://overpass-api.de/api/interpreter'

async function overpass(query: string) {
  const res = await fetch(OVERPASS, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded; charset=UTF-8' },
    body: `data=${encodeURIComponent(query)}`,
  })
  if (!res.ok) throw new Error('Overpass API failed')
  return (await res.json()) as { elements?: any[] }
}

function normalizeElement(el: any): OSMElement | null {
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
    name: typeof el.tags?.name === 'string' ? el.tags.name : undefined,
    tags: el.tags ?? undefined,
  }
}

export async function osmHotels(lat: number, lon: number, radiusMeters = 6000) {
  const q = `
[out:json][timeout:25];
(
  node["tourism"~"^(hotel|guest_house)$"](around:${radiusMeters},${lat},${lon});
  way["tourism"~"^(hotel|guest_house)$"](around:${radiusMeters},${lat},${lon});
  relation["tourism"~"^(hotel|guest_house)$"](around:${radiusMeters},${lat},${lon});
);
out center 50;`
  const data = await overpass(q)
  return (data.elements ?? [])
    .map(normalizeElement)
    .filter(Boolean) as OSMElement[]
}

export async function osmTransport(lat: number, lon: number, radiusMeters = 6000) {
  const q = `
[out:json][timeout:25];
(
  node["highway"="bus_stop"](around:${radiusMeters},${lat},${lon});
  node["railway"="station"](around:${Math.max(radiusMeters, 15000)},${lat},${lon});
  node["aeroway"="aerodrome"](around:${Math.max(radiusMeters, 50000)},${lat},${lon});
);
out 80;`
  const data = await overpass(q)
  return (data.elements ?? [])
    .map(normalizeElement)
    .filter(Boolean) as OSMElement[]
}

