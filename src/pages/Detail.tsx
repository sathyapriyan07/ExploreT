import * as React from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { ExternalLink, Heart, MapPinned, Sparkles, Landmark } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuth } from '@/context/auth'
import { addViewedPlace } from '@/utils/history'
import { wikiMediaImages, wikiNearbyPlaces, wikiSearch, wikiSummary } from '@/services/wiki'
import { osmHotels, osmTransport } from '@/services/osm'
import { savePlace, upsertPreferences } from '@/services/db'
import { MiniMap } from '@/components/map/MiniMap'
import { api, type WeatherBundle } from '@/services/api'
import { WeatherWidget } from '@/components/WeatherWidget'
import { hasMapTiler, type BaseMapStyle } from '@/utils/map'
import type { OSMElement } from '@/services/osm'

type SimilarCategory =
  | { key: 'beach'; label: 'Beaches' }
  | { key: 'hills'; label: 'Hills' }
  | { key: 'historical'; label: 'Historical' }
  | { key: 'city'; label: 'Cities' }

export default function DetailPage() {
  const { title: raw } = useParams()
  const title = decodeURIComponent(raw ?? '')
  const navigate = useNavigate()
  const { user } = useAuth()

  const POI_RADIUS_METERS = 4500

  const summaryQ = useQuery({
    queryKey: ['wikiSummary', title],
    queryFn: () => api.wiki(title),
    enabled: Boolean(title),
    refetchOnMount: 'always',
  })

  const coords = summaryQ.data?.coordinates ?? null
  const [baseMap, setBaseMap] = React.useState<BaseMapStyle>(
    hasMapTiler() ? 'hybrid' : 'streets',
  )

  function inferSimilarCategory(text: string): SimilarCategory {
    const t = text.toLowerCase()

    const beach =
      t.includes('beach') ||
      t.includes('coast') ||
      t.includes('coastal') ||
      t.includes('seaside') ||
      t.includes('island') ||
      t.includes('backwater') ||
      t.includes('backwaters')

    const hills =
      t.includes('hill station') ||
      t.includes('mountain') ||
      t.includes('hills') ||
      t.includes('himalaya') ||
      t.includes('valley') ||
      t.includes('trek') ||
      t.includes('waterfall')

    const historical =
      t.includes('fort') ||
      t.includes('palace') ||
      t.includes('temple') ||
      t.includes('heritage') ||
      t.includes('ruins') ||
      t.includes('monument') ||
      t.includes('museum')

    if (beach) return { key: 'beach', label: 'Beaches' }
    if (hills) return { key: 'hills', label: 'Hills' }
    if (historical) return { key: 'historical', label: 'Historical' }
    return { key: 'city', label: 'Cities' }
  }

  function inferRegionFromDescription(desc: string | null | undefined) {
    const d = String(desc || '').trim()
    const m = d.match(/\bin\s+(.+)$/i)
    if (!m?.[1]) return null
    const afterIn = m[1].trim()
    if (!afterIn) return null
    // Prefer the first admin name, e.g. "Kerala" from "Kerala, India"
    const first = afterIn.split(',')[0]?.trim()
    return first || null
  }

  const similarMeta = React.useMemo(() => {
    const text = [
      summaryQ.data?.title ?? title,
      summaryQ.data?.description ?? '',
      summaryQ.data?.summary ?? '',
    ]
      .filter(Boolean)
      .join(' · ')

    return {
      category: inferSimilarCategory(text),
      region: inferRegionFromDescription(summaryQ.data?.description),
    }
  }, [summaryQ.data?.description, summaryQ.data?.summary, summaryQ.data?.title, title])

  function haversineKm(a: { lat: number; lon: number }, b: { lat: number; lon: number }) {
    const toRad = (n: number) => (n * Math.PI) / 180
    const R = 6371
    const dLat = toRad(b.lat - a.lat)
    const dLon = toRad(b.lon - a.lon)
    const lat1 = toRad(a.lat)
    const lat2 = toRad(b.lat)
    const s =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2)
    return 2 * R * Math.asin(Math.sqrt(s))
  }

  function formatDistance(km: number) {
    if (!Number.isFinite(km)) return ''
    if (km < 1) return `${Math.round(km * 1000)} m`
    return `${(Math.round(km * 10) / 10).toFixed(1)} km`
  }

  function hotelDisplayName(h: OSMElement) {
    const nameEn = h.tags?.['name:en']
    const raw =
      (typeof nameEn === 'string' && nameEn.trim() ? nameEn.trim() : null) ??
      (h.name && h.name.trim() ? h.name.trim() : null) ??
      (h.tags?.brand && h.tags.brand.trim() ? h.tags.brand.trim() : null) ??
      (h.tags?.operator && h.tags.operator.trim() ? h.tags.operator.trim() : null) ??
      null

    if (!raw || raw.toLowerCase() === 'hotel') {
      const suffix = String(h.id).slice(-4)
      return `Hotel ${suffix}`
    }
    return raw
  }

  function transportTypeLabel(t: OSMElement) {
    const highway = t.tags?.highway
    const railway = t.tags?.railway
    const aeroway = t.tags?.aeroway

    if (railway === 'station') return 'station'
    if (aeroway === 'aerodrome') return 'airport'
    if (highway === 'bus_stop') return 'bus stop'
    if (highway) return highway.replaceAll('_', ' ')
    if (railway) return railway.replaceAll('_', ' ')
    if (aeroway) return aeroway.replaceAll('_', ' ')
    return 'transport'
  }

  function transportDisplayName(t: OSMElement) {
    const nameEn = t.tags?.['name:en']
    const raw =
      (typeof nameEn === 'string' && nameEn.trim() ? nameEn.trim() : null) ??
      (t.name && t.name.trim() ? t.name.trim() : null) ??
      (t.tags?.ref && t.tags.ref.trim() ? t.tags.ref.trim() : null) ??
      (t.tags?.local_ref && t.tags.local_ref.trim() ? t.tags.local_ref.trim() : null) ??
      null

    if (raw && raw.toLowerCase() !== 'bus_stop' && raw.toLowerCase() !== 'bus stop') {
      return raw
    }

    const label = transportTypeLabel(t)
    const suffix = String(t.id).slice(-4)
    if (label === 'station') return `Station ${suffix}`
    if (label === 'airport') return `Airport ${suffix}`
    if (label === 'bus stop') return `Bus stop ${suffix}`
    return `Transport ${suffix}`
  }

  function transportTabLabel(type: string) {
    if (type === 'bus stop') return 'Bus stops'
    if (type === 'station') return 'Stations'
    if (type === 'airport') return 'Airports'
    return type.replaceAll('_', ' ')
  }

  React.useEffect(() => {
    if (!title) return
    addViewedPlace(title)
    if (user) {
      void upsertPreferences({
        user_id: user.id,
        last_viewed: title,
      })
    }
  }, [title, user])

  const mediaQ = useQuery({
    queryKey: ['wikiMedia', title],
    queryFn: () => wikiMediaImages(title, 12),
    enabled: Boolean(title),
  })

  const nearbyQ = useQuery({
    queryKey: ['wikiNearby', coords?.lat, coords?.lon],
    queryFn: () => wikiNearbyPlaces(coords!.lat, coords!.lon, 15000, 18),
    enabled: Boolean(coords),
  })

  const nearbyThumbsQ = useQuery({
    queryKey: ['nearbyThumbs', nearbyQ.data?.[0]?.pageid],
    queryFn: async () => {
      const items = (nearbyQ.data ?? []).slice(0, 10)
      const entries = await Promise.all(
        items.map(async (p) => {
          try {
            const s = await api.wiki(p.title)
            return [p.title, s.thumbnail] as const
          } catch {
            return [p.title, null] as const
          }
        }),
      )
      return Object.fromEntries(entries) as Record<string, string | null>
    },
    enabled: Boolean(nearbyQ.data?.length),
    staleTime: 6 * 60 * 60 * 1000,
  })

  async function searchPlaces(query: string) {
    try {
      const res = await api.search(query)
      return res.map((r) => ({
        title: r.title,
        description: r.description ?? null,
        snippet: r.snippet ?? null,
      }))
    } catch {
      const res = await wikiSearch(query, 12)
      return res.map((r) => ({
        title: r.title,
        description: r.description ?? null,
        snippet: r.snippet ?? null,
      }))
    }
  }

  function buildSimilarQuery() {
    const region = similarMeta.region
    const k = similarMeta.category.key

    if (k === 'beach') return region ? `${region} beach` : 'popular beaches'
    if (k === 'hills') return region ? `${region} hill station` : 'hill stations'
    if (k === 'historical') return region ? `${region} fort` : 'heritage sites'
    return region ? `${region} tourist attractions` : 'tourist destinations'
  }

  const similarQ = useQuery({
    queryKey: ['similarPlaces', title, similarMeta.category.key, similarMeta.region],
    queryFn: async () => {
      const q = buildSimilarQuery()
      const items = await searchPlaces(q)

      const self = title.trim().toLowerCase()
      const filtered = items.filter((p) => p.title.trim().toLowerCase() !== self)

      const kw =
        similarMeta.category.key === 'beach'
          ? ['beach', 'coast', 'coastal', 'seaside', 'island', 'backwater']
          : similarMeta.category.key === 'hills'
            ? ['hill', 'mountain', 'valley', 'trek', 'waterfall', 'peak', 'himalaya']
            : similarMeta.category.key === 'historical'
              ? ['fort', 'palace', 'temple', 'heritage', 'monument', 'ruins', 'museum']
              : ['city', 'town', 'capital', 'metropolitan', 'tourism']

      const score = (p: { description: string | null; snippet: string | null }) => {
        const t = `${p.description ?? ''} ${p.snippet ?? ''}`.toLowerCase()
        return kw.reduce((acc, k) => (t.includes(k) ? acc + 1 : acc), 0)
      }

      const scored = filtered
        .map((p) => ({ p, s: score(p) }))
        .sort((a, b) => b.s - a.s)
        .map(({ p }) => p)

      return scored.slice(0, 6)
    },
    enabled: Boolean(title),
    staleTime: 6 * 60 * 60 * 1000,
  })

  async function getWikiThumb(placeTitle: string) {
    try {
      const s = await api.wiki(placeTitle)
      if (s.thumbnail) return s.thumbnail
    } catch {
      // Fall back to direct Wikipedia fetch (works even on static hosting without /api routes).
    }

    try {
      const s = await wikiSummary(placeTitle)
      return s.thumbnail ?? null
    } catch {
      return null
    }
  }

  const similarThumbsQ = useQuery({
    queryKey: ['similarThumbs', similarQ.data?.[0]?.title],
    queryFn: async () => {
      const items = (similarQ.data ?? []).slice(0, 6)
      const entries = await Promise.all(
        items.map(async (p) => {
          const thumb = await getWikiThumb(p.title)
          return [p.title, thumb] as const
        }),
      )
      return Object.fromEntries(entries) as Record<string, string | null>
    },
    enabled: Boolean(similarQ.data?.length),
    staleTime: 6 * 60 * 60 * 1000,
  })

  const weatherQ = useQuery({
    queryKey: ['weather', coords?.lat, coords?.lon],
    queryFn: () => api.weather(coords!.lat, coords!.lon),
    enabled: Boolean(coords),
  })

  const poisQ = useQuery({
    queryKey: ['nearbyPois', coords?.lat, coords?.lon],
    queryFn: () => api.nearby(coords!.lat, coords!.lon, POI_RADIUS_METERS),
    enabled: Boolean(coords),
  })

  const hotelsQ = useQuery({
    queryKey: ['osmHotels', coords?.lat, coords?.lon],
    queryFn: () => osmHotels(coords!.lat, coords!.lon, 6000),
    enabled: Boolean(coords),
  })

  const transportQ = useQuery({
    queryKey: ['osmTransport', coords?.lat, coords?.lon],
    queryFn: () => osmTransport(coords!.lat, coords!.lon, 8000),
    enabled: Boolean(coords),
  })

  const hasNearby = (nearbyQ.data?.length ?? 0) > 0
  const hasHotels = (hotelsQ.data?.length ?? 0) > 0
  const hasTransport = (transportQ.data?.length ?? 0) > 0
  const hasPois = (poisQ.data?.length ?? 0) > 0

  const shoeTips = React.useMemo(() => {
    function isWetCode(code: number) {
      return (
        (code >= 51 && code <= 67) ||
        (code >= 80 && code <= 82) ||
        code === 95 ||
        code === 96 ||
        code === 99
      )
    }

    function isSnowCode(code: number) {
      return (code >= 71 && code <= 77) || code === 85 || code === 86
    }

    function maxUpcomingPrecipProb(bundle: WeatherBundle | null | undefined) {
      const probs = bundle?.hourly?.precipitation_probability
      if (!Array.isArray(probs) || probs.length === 0) return null
      const next = probs.slice(0, 12).filter((v) => typeof v === 'number') as number[]
      if (!next.length) return null
      return Math.max(...next)
    }

    const t = weatherQ.data?.current?.temperature
    const code = weatherQ.data?.current?.weathercode
    const maxPrecip = maxUpcomingPrecipProb(weatherQ.data)

    const wet =
      (typeof code === 'number' && isWetCode(code)) ||
      (typeof maxPrecip === 'number' && maxPrecip >= 40)
    const snowy = typeof code === 'number' && isSnowCode(code)

    const items: string[] = []
    if (snowy || (typeof t === 'number' && t <= 8)) {
      items.push('Insulated, waterproof boots (good grip)')
    } else if (typeof t === 'number' && t >= 28) {
      items.push('Breathable walking shoes or sport sandals')
    } else {
      items.push('Cushioned walking sneakers (all-day comfort)')
    }

    if (wet) {
      items.push('Water-resistant shoes + quick-dry socks')
    }

    items.push('Blister pads (long walking days)')

    const contextBits: string[] = []
    if (typeof t === 'number') contextBits.push(`${Math.round(t)}°C`)
    if (typeof maxPrecip === 'number') contextBits.push(`${maxPrecip}% rain chance (next ~12h)`)

    return {
      items,
      context: contextBits.length ? `Based on: ${contextBits.join(' · ')}` : null,
    }
  }, [weatherQ.data])

  const transportTabs = React.useMemo(() => {
    if (!coords || !hasTransport) return null

    const items = (transportQ.data ?? [])
      .map((t) => ({
        t,
        type: transportTypeLabel(t),
        km: haversineKm(coords, { lat: t.lat, lon: t.lon }),
      }))
      .sort((a, b) => a.km - b.km)

    const grouped = items.reduce<Record<string, typeof items>>((acc, item) => {
      ;(acc[item.type] ??= []).push(item)
      return acc
    }, {})

    const priority = new Map<string, number>([
      ['bus stop', 1],
      ['station', 2],
      ['airport', 3],
    ])

    const keys = Object.keys(grouped).sort((a, b) => {
      const pa = priority.get(a) ?? 99
      const pb = priority.get(b) ?? 99
      if (pa !== pb) return pa - pb
      return a.localeCompare(b)
    })

    return { keys, grouped }
  }, [coords, hasTransport, transportQ.data])

  function poiWikiTitle(poi: { name: string | null; tags: Record<string, string> | null }) {
    const wp = poi.tags?.wikipedia
    if (typeof wp === 'string' && wp.trim()) {
      const value = wp.trim()
      // common formats: "en:Article", "Article"
      if (value.includes(':')) {
        const [lang, ...rest] = value.split(':')
        if (lang.length <= 3 && rest.length) return rest.join(':').trim()
        return value.split(':').slice(1).join(':').trim()
      }
      return value
    }
    return poi.name
  }

  const poiThumbsQ = useQuery({
    queryKey: ['poiThumbs', poisQ.data?.[0]?.id],
    queryFn: async () => {
      const items = (poisQ.data ?? [])
        .filter((p) => Boolean(p.name))
        .slice(0, 12)

      const entries = await Promise.all(
        items.map(async (p) => {
          const t = poiWikiTitle(p)
          if (!t) return [String(p.id), null] as const
          try {
            const s = await api.wiki(t)
            return [String(p.id), s.thumbnail] as const
          } catch {
            return [String(p.id), null] as const
          }
        }),
      )
      return Object.fromEntries(entries) as Record<string, string | null>
    },
    enabled: hasPois,
    staleTime: 6 * 60 * 60 * 1000,
  })

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user || !coords) throw new Error('Sign in required')
      const image =
        summaryQ.data?.thumbnail ??
        mediaQ.data?.[0]?.url ??
        null
      await savePlace({
        user_id: user.id,
        title,
        lat: coords.lat,
        lon: coords.lon,
        image_url: image,
      })
    },
  })

  const hero = summaryQ.data?.thumbnail ?? mediaQ.data?.[0]?.url ?? null

  function goAuth() {
    navigate(`/auth?redirect=${encodeURIComponent(window.location.pathname)}`)
  }

  return (
    <div className="space-y-10">
      <section className="relative -mx-4 overflow-hidden rounded-3xl border border-border/70 bg-card/70 shadow-[var(--shadow-soft)] backdrop-blur-xl md:-mx-6">
        {hero ? (
          <img
            src={hero}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-30 saturate-[1.05]"
          />
        ) : null}
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
        <div className="relative p-7 md:p-12">
          {summaryQ.isLoading ? (
            <div className="space-y-3">
              <Skeleton className="h-8 w-80" />
              <Skeleton className="h-5 w-[36rem]" />
            </div>
          ) : (
            <>
              <h1 className="text-3xl font-semibold tracking-tight md:text-5xl">
                {summaryQ.data?.title ?? title}
              </h1>
              <p className="mt-3 max-w-3xl text-muted-foreground md:text-lg">
                {summaryQ.data?.summary ?? 'No summary available.'}
              </p>
              <div className="mt-5 flex flex-wrap gap-3">
                <Button
                  variant="secondary"
                  onClick={() => (user ? void saveMutation.mutateAsync() : goAuth())}
                >
                  <Heart className="mr-2 size-4" />
                  Save place
                </Button>
                <Button
                  onClick={() => {
                    if (!coords) return
                    if (!user) return goAuth()
                    navigate(
                      `/planner?destination=${encodeURIComponent(title)}&lat=${coords.lat}&lon=${coords.lon}`,
                    )
                  }}
                >
                  <Sparkles className="mr-2 size-4" />
                  Plan trip
                </Button>
                {summaryQ.data?.pageUrl ? (
                  <Button asChild variant="outline">
                    <a href={summaryQ.data.pageUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="mr-2 size-4" />
                      Wikipedia
                    </a>
                  </Button>
                ) : null}
              </div>
              {saveMutation.error ? (
                <div className="mt-4 text-sm text-destructive">
                  {saveMutation.error instanceof Error
                    ? saveMutation.error.message
                    : 'Could not save'}
                </div>
              ) : null}
            </>
          )}
        </div>
      </section>

      {coords ? (
        <section className="grid gap-6 lg:grid-cols-5">
          <div className="lg:col-span-3">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-xl font-semibold tracking-tight">
                Map preview
              </h2>
              <Button asChild variant="link" className="px-0">
                <Link to="/map">
                  <MapPinned className="mr-2 size-4" />
                  Open full map
                </Link>
              </Button>
            </div>

            <div className="mb-3 flex flex-wrap gap-2">
              <Button
                size="sm"
                variant={baseMap === 'streets' ? 'default' : 'secondary'}
                onClick={() => setBaseMap('streets')}
              >
                Street
              </Button>
              <Button
                size="sm"
                variant={baseMap === 'satellite' ? 'default' : 'secondary'}
                onClick={() => setBaseMap('satellite')}
                disabled={!hasMapTiler()}
                title={
                  !hasMapTiler()
                    ? 'Set VITE_MAPTILER_KEY for satellite tiles'
                    : undefined
                }
              >
                Satellite
              </Button>
              <Button
                size="sm"
                variant={baseMap === 'hybrid' ? 'default' : 'secondary'}
                onClick={() => setBaseMap('hybrid')}
                disabled={!hasMapTiler()}
                title={
                  !hasMapTiler()
                    ? 'Set VITE_MAPTILER_KEY for hybrid tiles'
                    : undefined
                }
              >
                Hybrid
              </Button>
              <Button
                size="sm"
                variant={baseMap === 'dark' ? 'default' : 'secondary'}
                onClick={() => setBaseMap('dark')}
                disabled={!hasMapTiler()}
                title={
                  !hasMapTiler()
                    ? 'Set VITE_MAPTILER_KEY for dark tiles'
                    : undefined
                }
              >
                Dark
              </Button>
            </div>
            <MiniMap
              center={coords}
              baseMap={baseMap}
              markers={[
                { title, lat: coords.lat, lon: coords.lon, variant: 'primary' },
                ...(nearbyQ.data ?? [])
                  .slice(0, 7)
                  .map((p) => ({
                    title: p.title,
                    lat: p.lat,
                    lon: p.lon,
                    variant: 'muted' as const,
                  })),
              ]}
            />
          </div>

          <div className="space-y-4 lg:col-span-2">
            {weatherQ.isLoading ? (
              <Skeleton className="h-44" />
            ) : weatherQ.data ? (
              <WeatherWidget data={weatherQ.data} />
            ) : weatherQ.error ? (
              <Card className="p-4 text-sm text-destructive">
                Weather unavailable
              </Card>
            ) : null}

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Shoe recommendations</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                  {shoeTips.items.map((t) => (
                    <li key={t}>{t}</li>
                  ))}
                </ul>
                {shoeTips.context ? (
                  <div className="mt-2 text-xs text-muted-foreground">{shoeTips.context}</div>
                ) : null}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Similar places</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="mb-2 text-xs text-muted-foreground">
                  {similarMeta.category.label}
                  {similarMeta.region ? ` · around ${similarMeta.region}` : ''}
                </div>

                {similarQ.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : similarQ.data?.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {similarQ.data.map((p) => (
                      <Link
                        key={p.title}
                        to={`/place/${encodeURIComponent(p.title)}`}
                        className="rounded-2xl border border-border/70 bg-background/30 p-3 transition-colors hover:bg-background/40"
                      >
                        <div className="flex items-center gap-3">
                          {similarThumbsQ.data?.[p.title] ? (
                            <img
                              src={similarThumbsQ.data[p.title]!}
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 shrink-0 rounded-xl border border-border/70 object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-xl border border-border/70 bg-gradient-to-br from-muted/60 to-background/20" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{p.title}</div>
                            <div className="text-xs text-muted-foreground">
                              {p.description ?? p.snippet ?? 'Open details'}
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No similar places found.</div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Hotels nearby (OSM)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {hotelsQ.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                    <Skeleton className="h-4 w-4/6" />
                  </div>
                ) : hasHotels ? (
                  <ul className="space-y-2 text-sm">
                    {(hotelsQ.data ?? [])
                      .map((h) => ({
                        h,
                        km: coords ? haversineKm(coords, { lat: h.lat, lon: h.lon }) : Number.NaN,
                      }))
                      .sort((a, b) => a.km - b.km)
                      .slice(0, 10)
                      .map(({ h, km }) => (
                        <li key={`${h.type}:${h.id}`}>
                          <span className="font-medium">{hotelDisplayName(h)}</span>
                          <span className="ml-2 text-xs text-muted-foreground">
                            {(h.tags?.tourism ?? 'hotel').replaceAll('_', ' ')}
                          </span>
                          {coords ? (
                            <span className="ml-2 text-xs text-muted-foreground">
                              · {formatDistance(km)}
                            </span>
                          ) : null}
                        </li>
                      ))}
                  </ul>
                ) : (
                  <div className="text-sm text-muted-foreground">No hotels found nearby.</div>
                )}
              </CardContent>
            </Card>
          </div>
        </section>
      ) : null}

      {!coords && !summaryQ.isLoading ? (
        <Card className="p-4 text-sm text-muted-foreground">
          This Wikipedia page doesn’t provide coordinates, so map/weather/nearby
          sections can’t load for it.
        </Card>
      ) : null}

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Gallery</h2>
        {mediaQ.isLoading ? (
          <div className="grid gap-3 md:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="aspect-[16/10]" />
            ))}
          </div>
        ) : mediaQ.data?.length ? (
          <div className="grid gap-3 md:grid-cols-3">
            {mediaQ.data.slice(0, 9).map((img) => (
              <div
                key={img.url}
                className="group relative aspect-[16/10] overflow-hidden rounded-xl border bg-muted"
              >
                <img
                  src={img.url}
                  alt={img.caption ?? ''}
                  loading="lazy"
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]"
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-muted-foreground">No gallery images found.</div>
        )}
      </section>

      {coords && (hasNearby || hasTransport || transportQ.isLoading || nearbyQ.isLoading) ? (
        <section className="grid gap-4 md:grid-cols-2">
          {hasNearby || nearbyQ.isLoading ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Nearby iconic places</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {nearbyQ.isLoading ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {Array.from({ length: 6 }).map((_, i) => (
                      <Skeleton key={i} className="h-20" />
                    ))}
                  </div>
                ) : hasNearby ? (
                  <div className="grid gap-3 md:grid-cols-2">
                    {(nearbyQ.data ?? []).slice(0, 6).map((p) => (
                      <Link
                        key={p.pageid}
                        to={`/place/${encodeURIComponent(p.title)}`}
                        className="rounded-2xl border border-border/70 bg-background/30 p-3 transition-colors hover:bg-background/40"
                      >
                        <div className="flex items-center gap-3">
                          {nearbyThumbsQ.data?.[p.title] ? (
                            <img
                              src={nearbyThumbsQ.data[p.title]!}
                              alt=""
                              loading="lazy"
                              className="h-12 w-12 shrink-0 rounded-xl border border-border/70 object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 shrink-0 rounded-xl border border-border/70 bg-gradient-to-br from-muted/60 to-background/20" />
                          )}
                          <div className="min-w-0">
                            <div className="truncate text-sm font-medium">{p.title}</div>
                            <div className="text-xs text-muted-foreground">
                              ~{Math.round(p.dist / 100) / 10} km away
                            </div>
                          </div>
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {hasTransport || transportQ.isLoading ? (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Travel info (OSM)</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                {transportQ.isLoading ? (
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : transportTabs?.keys.length ? (
                  <Tabs defaultValue={transportTabs.keys[0]} className="w-full">
                    <TabsList className="mb-3 w-full justify-start gap-1 overflow-x-auto scrollbar-hide">
                      {transportTabs.keys.map((k) => (
                        <TabsTrigger key={k} value={k}>
                          {transportTabLabel(k)}
                        </TabsTrigger>
                      ))}
                    </TabsList>
                    {transportTabs.keys.map((k) => (
                      <TabsContent key={k} value={k}>
                        <ul className="space-y-2 text-sm">
                          {(transportTabs.grouped[k] ?? []).slice(0, 10).map(({ t, km }) => (
                            <li key={`${t.type}:${t.id}`}>
                              <span className="font-medium">{transportDisplayName(t)}</span>
                              <span className="ml-2 text-xs text-muted-foreground">
                                · {formatDistance(km)}
                              </span>
                            </li>
                          ))}
                        </ul>
                      </TabsContent>
                    ))}
                  </Tabs>
                ) : null}
              </CardContent>
            </Card>
          ) : null}
        </section>
      ) : null}

      {coords && (hasPois || poisQ.isLoading) ? (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold tracking-tight">
              Nearby POIs (Overpass)
            </h2>
            <div className="text-xs text-muted-foreground">
              radius {(POI_RADIUS_METERS / 1000).toFixed(1)} km
            </div>
          </div>
          {poisQ.isLoading ? (
            <div className="grid gap-3 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} className="h-24" />
              ))}
            </div>
          ) : hasPois ? (
            <div className="grid gap-3 md:grid-cols-3">
              {(poisQ.data ?? []).slice(0, 12).map((p) => (
                <Card key={`${p.type}:${p.id}`} className="p-3">
                  <div className="flex items-start gap-3">
                    <Landmark className="mt-0.5 size-4 text-muted-foreground" />
                    {poiThumbsQ.data?.[String(p.id)] ? (
                      <img
                        src={poiThumbsQ.data[String(p.id)]!}
                        alt=""
                        loading="lazy"
                        className="mt-0.5 size-12 shrink-0 rounded-xl border border-border/70 object-cover"
                      />
                    ) : null}
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {p.name ?? 'Point of interest'}
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">
                          {p.tags?.tourism ||
                            p.tags?.historic ||
                            p.tags?.leisure ||
                            p.tags?.amenity ||
                            'poi'}
                        </span>
                        {coords ? (
                          <span>
                            · {formatDistance(haversineKm(coords, { lat: p.lat, lon: p.lon }))}
                          </span>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
