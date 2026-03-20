export async function getJson<T>(
  path: string,
  params?: Record<string, string | number | boolean | undefined | null>,
): Promise<T> {
  const url = new URL(path, window.location.origin)
  if (params) {
    for (const [k, v] of Object.entries(params)) {
      if (v === undefined || v === null || v === '') continue
      url.searchParams.set(k, String(v))
    }
  }

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { accept: 'application/json' },
  })
  if (!res.ok) {
    const text = await res.text().catch(() => '')
    throw new Error(text ? `${res.status}: ${text}` : `${res.status}: Request failed`)
  }
  return (await res.json()) as T
}

export type WikiSummary = {
  title: string
  description: string | null
  summary: string | null
  thumbnail: string | null
  coordinates: { lat: number; lon: number } | null
  pageUrl?: string | null
}

export type WikiSearchItem = {
  title: string
  description: string | null
  snippet: string | null
}

export type WeatherBundle = {
  current: {
    temperature?: number
    windspeed?: number
    weathercode?: number
    time?: string
  } | null
  hourly: {
    time?: string[]
    temperature_2m?: number[]
    precipitation_probability?: number[]
    relativehumidity_2m?: number[]
    weathercode?: number[]
  } | null
}

export type NearbyPoi = {
  id: number
  type: 'node' | 'way' | 'relation'
  lat: number
  lon: number
  name: string | null
  tags: Record<string, string> | null
}

export const api = {
  wiki(place: string) {
    return getJson<WikiSummary>('/api/wiki', { place })
  },
  search(query: string) {
    return getJson<WikiSearchItem[]>('/api/search', { query })
  },
  weather(lat: number, lon: number) {
    return getJson<WeatherBundle>('/api/weather', { lat, lon })
  },
  nearby(lat: number, lon: number, radius?: number) {
    return getJson<NearbyPoi[]>('/api/nearby', { lat, lon, radius })
  },
}
