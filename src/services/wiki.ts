export type WikiSearchResult = {
  title: string
  description?: string
  snippet?: string
}

export type WikiSummary = {
  title: string
  description?: string
  extract?: string
  thumbnail?: string
  coordinates?: { lat: number; lon: number }
  pageUrl?: string
}

export type WikiNearbyPlace = {
  title: string
  lat: number
  lon: number
  dist: number
  pageid: number
}

const WIKI_REST = 'https://en.wikipedia.org/api/rest_v1'
const WIKI_REST2 = 'https://en.wikipedia.org/w/rest.php/v1'
const WIKI_API = 'https://en.wikipedia.org/w/api.php'

export async function wikiSearch(query: string, limit = 12): Promise<WikiSearchResult[]> {
  const q = query.trim()
  if (!q) return []
  const url = `${WIKI_REST2}/search/title?q=${encodeURIComponent(q)}&limit=${limit}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error('Wikipedia search failed')
  const data = (await res.json()) as { pages?: Array<{ title: string; description?: string; excerpt?: string }> }
  return (data.pages ?? []).map((p) => ({
    title: p.title,
    description: p.description,
    snippet: p.excerpt,
  }))
}

export async function wikiSummary(title: string): Promise<WikiSummary> {
  const url = `${WIKI_REST}/page/summary/${encodeURIComponent(title)}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) throw new Error('Wikipedia summary failed')
  const data = await res.json()

  const coordinates =
    data?.coordinates && typeof data.coordinates.lat === 'number'
      ? { lat: data.coordinates.lat, lon: data.coordinates.lon }
      : undefined

  const thumbnail =
    data?.thumbnail?.source && typeof data.thumbnail.source === 'string'
      ? data.thumbnail.source
      : undefined

  const pageUrl =
    data?.content_urls?.desktop?.page && typeof data.content_urls.desktop.page === 'string'
      ? data.content_urls.desktop.page
      : undefined

  return {
    title: data?.title ?? title,
    description: data?.description,
    extract: data?.extract,
    coordinates,
    thumbnail,
    pageUrl,
  }
}

export async function wikiCoordinates(title: string): Promise<{ lat: number; lon: number } | null> {
  const params = new URLSearchParams({
    action: 'query',
    prop: 'coordinates',
    titles: title,
    format: 'json',
    origin: '*',
  })
  const res = await fetch(`${WIKI_API}?${params.toString()}`)
  if (!res.ok) return null
  const data = await res.json()
  const pages = data?.query?.pages
  const first = pages ? pages[Object.keys(pages)[0]] : null
  const c = first?.coordinates?.[0]
  if (!c || typeof c.lat !== 'number' || typeof c.lon !== 'number') return null
  return { lat: c.lat, lon: c.lon }
}

export async function wikiNearbyPlaces(
  lat: number,
  lon: number,
  radiusMeters = 15000,
  limit = 20,
): Promise<WikiNearbyPlace[]> {
  const params = new URLSearchParams({
    action: 'query',
    list: 'geosearch',
    gscoord: `${lat}|${lon}`,
    gsradius: String(radiusMeters),
    gslimit: String(limit),
    format: 'json',
    origin: '*',
  })
  const res = await fetch(`${WIKI_API}?${params.toString()}`)
  if (!res.ok) throw new Error('Wikipedia nearby places failed')
  const data = await res.json()
  return (data?.query?.geosearch ?? []).map((p: any) => ({
    title: p.title,
    lat: p.lat,
    lon: p.lon,
    dist: p.dist,
    pageid: p.pageid,
  }))
}

export type WikiMediaImage = { url: string; caption?: string }

export async function wikiMediaImages(title: string, limit = 12): Promise<WikiMediaImage[]> {
  const url = `${WIKI_REST}/page/media-list/${encodeURIComponent(title)}`
  const res = await fetch(url, { headers: { accept: 'application/json' } })
  if (!res.ok) return []
  const data = await res.json()

  const items: any[] = Array.isArray(data?.items) ? data.items : []
  const images = items
    .filter((i) => i?.type === 'image')
    .map((i) => {
      const src =
        i?.srcset?.[0]?.src ||
        i?.original?.source ||
        i?.thumbnail?.source
      if (!src) return null
      const caption =
        typeof i?.caption?.text === 'string' ? i.caption.text : undefined
      return { url: src, caption }
    })
    .filter(Boolean) as WikiMediaImage[]

  return images.slice(0, limit)
}

