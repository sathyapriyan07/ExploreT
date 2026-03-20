import { fetchWithTimeout } from './http.js'

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1'
const WIKI_REST2 = 'https://en.wikipedia.org/w/rest.php/v1'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'

// Wikimedia services may block requests without a user-agent. Keep this descriptive.
const UA = 'ExploreX/1.0 (+https://localhost; contact: local-dev)'

async function wikiCoordinatesActionApi(place) {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'coordinates',
    titles: place,
    format: 'json',
    origin: '*',
  })
  const res = await fetchWithTimeout(
    `${WIKI_API}?${params.toString()}`,
    { headers: { accept: 'application/json', 'user-agent': UA } },
    15000,
  )
  if (!res.ok) return null
  const data = await res.json()
  const pages = data?.query?.pages
  const first = pages ? pages[Object.keys(pages)[0]] : null
  const c = first?.coordinates?.[0]
  if (!c || typeof c.lat !== 'number' || typeof c.lon !== 'number') return null
  return { lat: c.lat, lon: c.lon }
}

async function wikiCoordinatesWikidata(wikibaseItem) {
  const id = String(wikibaseItem || '').trim()
  if (!id) return null
  const url = `https://www.wikidata.org/wiki/Special:EntityData/${encodeURIComponent(id)}.json`
  const res = await fetchWithTimeout(
    url,
    { headers: { accept: 'application/json', 'user-agent': UA } },
    15000,
  )
  if (!res.ok) return null
  const data = await res.json()
  const ent = data?.entities?.[id]
  const p = ent?.claims?.P625?.[0]?.mainsnak?.datavalue?.value
  if (!p || typeof p.latitude !== 'number' || typeof p.longitude !== 'number') return null
  return { lat: p.latitude, lon: p.longitude }
}

export async function wikiSummary(place) {
  const url = `${WIKI_REST}/page/summary/${encodeURIComponent(place)}`
  const res = await fetchWithTimeout(
    url,
    { headers: { accept: 'application/json', 'user-agent': UA } },
    15000,
  )
  if (!res.ok) throw new Error(`Wikipedia summary failed (${res.status})`)
  const data = await res.json()
  let coordinates =
    data?.coordinates && typeof data.coordinates.lat === 'number'
      ? { lat: data.coordinates.lat, lon: data.coordinates.lon }
      : null
  const thumbnail =
    data?.thumbnail?.source && typeof data.thumbnail.source === 'string'
      ? data.thumbnail.source
      : null
  const pageUrl =
    data?.content_urls?.desktop?.page && typeof data.content_urls.desktop.page === 'string'
      ? data.content_urls.desktop.page
      : null
  const wikibaseItem =
    typeof data?.wikibase_item === 'string' ? data.wikibase_item : null

  // Some pages do not include coordinates in the REST summary; fall back to action API.
  if (!coordinates) {
    coordinates = await wikiCoordinatesActionApi(place)
  }
  if (!coordinates && wikibaseItem) {
    coordinates = await wikiCoordinatesWikidata(wikibaseItem)
  }

  return {
    title: data?.title ?? place,
    description: data?.description ?? null,
    summary: data?.extract ?? null,
    thumbnail,
    coordinates,
    pageUrl,
  }
}

async function wikiSearchActionApi(query, limit) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'search',
    srsearch: query,
    srlimit: String(limit),
    srprop: 'snippet',
    format: 'json',
    origin: '*',
  })
  const res = await fetchWithTimeout(
    `${WIKI_API}?${params.toString()}`,
    { headers: { accept: 'application/json', 'user-agent': UA } },
    15000,
  )
  if (!res.ok) throw new Error(`Wikipedia search (action) failed (${res.status})`)
  const data = await res.json()
  const items = data?.query?.search ?? []
  return items.map((p) => ({
    title: p.title,
    description: null,
    snippet: p.snippet ?? null,
  }))
}

export async function wikiSearch(query, limit = 10) {
  const url = `${WIKI_REST2}/search/title?q=${encodeURIComponent(query)}&limit=${limit}`
  const res = await fetchWithTimeout(
    url,
    { headers: { accept: 'application/json', 'user-agent': UA } },
    15000,
  )

  if (res.status === 429) {
    // REST endpoint rate-limited; fall back to action=query search.
    return wikiSearchActionApi(query, limit)
  }

  if (!res.ok) throw new Error(`Wikipedia search failed (${res.status})`)
  const data = await res.json()
  const pages = Array.isArray(data?.pages) ? data.pages : []
  return pages.map((p) => ({
    title: p.title,
    description: p.description ?? null,
    snippet: p.excerpt ?? null,
  }))
}

export async function wikiGeoNearby(lat, lon, radiusMeters = 4500, limit = 30) {
  const params = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${lat}|${lon}`,
    gsradius: String(radiusMeters),
    gslimit: String(limit),
    format: 'json',
    origin: '*',
  })
  const res = await fetchWithTimeout(
    `${WIKI_API}?${params.toString()}`,
    { headers: { accept: 'application/json', 'user-agent': UA } },
    15000,
  )
  if (!res.ok) throw new Error(`Wikipedia geosearch failed (${res.status})`)
  const data = await res.json()
  return (data?.query?.geosearch ?? []).map((p) => ({
    title: p.title,
    lat: p.lat,
    lon: p.lon,
    dist: p.dist,
    pageid: p.pageid,
  }))
}
