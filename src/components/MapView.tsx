import * as React from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import {
  MapContainer,
  Marker,
  Popup,
  TileLayer,
  useMapEvents,
} from 'react-leaflet'
import { Layers, Search as SearchIcon, Sparkles } from 'lucide-react'

import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { setupLeafletDefaultIcons } from '@/components/map/leafletSetup'
import { MapInvalidateSize } from '@/components/map/MapInvalidateSize'
import { createPinIcon } from '@/components/map/pinIcon'
import { getMapTileConfig, hasMapTiler, type BaseMapStyle } from '@/utils/map'
import { wikiNearbyPlaces, wikiSummary } from '@/services/wiki'
import { osmHotels, osmTransport } from '@/services/osm'
import { useDebounce } from '@/hooks/useDebounce'
import { useAuth } from '@/context/auth'
import { api, type NearbyPoi } from '@/services/api'

type Center = { lat: number; lon: number }

function MapEvents({ onMoved }: { onMoved: (center: Center) => void }) {
  const map = useMapEvents({
    moveend() {
      const c = map.getCenter()
      onMoved({ lat: c.lat, lon: c.lng })
    },
  })
  return null
}

function distanceKm(a: Center, b: Center) {
  const toRad = (n: number) => (n * Math.PI) / 180
  const R = 6371
  const dLat = toRad(b.lat - a.lat)
  const dLon = toRad(b.lon - a.lon)
  const lat1 = toRad(a.lat)
  const lat2 = toRad(b.lat)
  const s =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) *
      Math.sin(dLon / 2) *
      Math.cos(lat1) *
      Math.cos(lat2)
  return 2 * R * Math.asin(Math.sqrt(s))
}

function formatDistance(km: number) {
  if (!Number.isFinite(km)) return ''
  if (km < 1) return `${Math.round(km * 1000)} m`
  return `${(Math.round(km * 10) / 10).toFixed(1)} km`
}

function poiWikiTitle(poi: NearbyPoi) {
  const wp = poi.tags?.wikipedia
  if (typeof wp === 'string' && wp.trim()) {
    const value = wp.trim()
    if (value.includes(':')) {
      const [lang, ...rest] = value.split(':')
      if (lang.length <= 3 && rest.length) return rest.join(':').trim()
      return value.split(':').slice(1).join(':').trim()
    }
    return value
  }
  return poi.name
}

export function MapView() {
  const navigate = useNavigate()
  const { user } = useAuth()

  const DEFAULT_DESTINATION = 'India'
  const DEFAULT_CENTER: Center = { lat: 22.3511148, lon: 78.6677428 }
  const DEFAULT_ZOOM = 5

  React.useEffect(() => {
    setupLeafletDefaultIcons()
  }, [])

  const pinPrimary = React.useMemo(() => createPinIcon('primary'), [])
  const pinMuted = React.useMemo(() => createPinIcon('muted'), [])

  const [searchText, setSearchText] = React.useState(DEFAULT_DESTINATION)
  const debounced = useDebounce(searchText, 450)

  const destQ = useQuery({
    queryKey: ['wikiSummary', debounced],
    queryFn: () => wikiSummary(debounced),
    enabled: debounced.trim().length >= 2,
  })

  const destCenter: Center | null = destQ.data?.coordinates
    ? { lat: destQ.data.coordinates.lat, lon: destQ.data.coordinates.lon }
    : null

  const [mapCenter, setMapCenter] = React.useState<Center>(
    destCenter ?? DEFAULT_CENTER,
  )
  const [searchCenter, setSearchCenter] = React.useState<Center>(mapCenter)
  const [zoom, setZoom] = React.useState(DEFAULT_ZOOM)

  React.useEffect(() => {
    if (destCenter) {
      setMapCenter(destCenter)
      setSearchCenter(destCenter)
      setZoom(debounced.trim().toLowerCase() === 'india' ? DEFAULT_ZOOM : 12)
    }
  }, [destCenter?.lat, destCenter?.lon, debounced])

  const [baseMap, setBaseMap] = React.useState<BaseMapStyle>(
    hasMapTiler() ? 'hybrid' : 'streets',
  )
  const [showPlaces, setShowPlaces] = React.useState(true)
  const [showHotels, setShowHotels] = React.useState(true)
  const [showTransport, setShowTransport] = React.useState(false)
  const [showPois, setShowPois] = React.useState(false)

  const POI_RADIUS_METERS = 4500

  const movedKm = distanceKm(mapCenter, searchCenter)
  const showSearchArea = movedKm > 1

  const placesQ = useQuery({
    queryKey: ['mapPlaces', searchCenter.lat, searchCenter.lon],
    queryFn: () => wikiNearbyPlaces(searchCenter.lat, searchCenter.lon, 20000, 35),
    enabled: showPlaces,
  })

  const hotelsQ = useQuery({
    queryKey: ['mapHotels', searchCenter.lat, searchCenter.lon],
    queryFn: () => osmHotels(searchCenter.lat, searchCenter.lon, 8000),
    enabled: showHotels,
  })

  const transportQ = useQuery({
    queryKey: ['mapTransport', searchCenter.lat, searchCenter.lon],
    queryFn: () => osmTransport(searchCenter.lat, searchCenter.lon, 9000),
    enabled: showTransport,
  })

  const poisQ = useQuery({
    queryKey: ['mapPois', searchCenter.lat, searchCenter.lon, POI_RADIUS_METERS],
    queryFn: () => api.nearby(searchCenter.lat, searchCenter.lon, POI_RADIUS_METERS),
    enabled: showPois,
    staleTime: 6 * 60 * 60 * 1000,
  })

  const poiThumbsQ = useQuery({
    queryKey: ['mapPoiThumbs', poisQ.data?.[0]?.id],
    queryFn: async () => {
      const items = (poisQ.data ?? []).filter((p) => Boolean(p.name)).slice(0, 12)
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
    enabled: Boolean(poisQ.data?.length),
    staleTime: 6 * 60 * 60 * 1000,
  })

  const tile = getMapTileConfig(baseMap)
  const places = placesQ.data ?? []
  const hotels = hotelsQ.data ?? []
  const transport = transportQ.data ?? []
  const pois = poisQ.data ?? []

  return (
    <div className="grid gap-6 lg:grid-cols-5">
      <div className="space-y-4 rounded-3xl border border-border/70 bg-card/40 p-4 shadow-[var(--shadow-soft)] backdrop-blur-xl lg:col-span-2">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Map discovery</h1>
          <div className="text-xs text-muted-foreground">
            Move map -&gt; search area
          </div>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
          <Input
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Jump to destination..."
            className="pl-11"
          />
        </div>

        <Card className="p-3">
          <div className="mb-2 flex items-center gap-2 text-sm font-medium">
            <Layers className="size-4" />
            Layers
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
          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              variant={showPlaces ? 'default' : 'secondary'}
              onClick={() => setShowPlaces((v) => !v)}
            >
              Places
            </Button>
            <Button
              size="sm"
              variant={showHotels ? 'default' : 'secondary'}
              onClick={() => setShowHotels((v) => !v)}
            >
              Hotels
            </Button>
            <Button
              size="sm"
              variant={showTransport ? 'default' : 'secondary'}
              onClick={() => setShowTransport((v) => !v)}
            >
              Transport
            </Button>
            <Button
              size="sm"
              variant={showPois ? 'default' : 'secondary'}
              onClick={() => setShowPois((v) => !v)}
            >
              POIs
            </Button>
          </div>
        </Card>

        <div className="space-y-3">
          <div className="text-sm font-medium">Results</div>
          {(placesQ.isLoading || hotelsQ.isLoading || transportQ.isLoading) &&
          !places.length &&
          !hotels.length ? (
            <div className="space-y-2">
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
              <Skeleton className="h-16" />
            </div>
          ) : (
            <div className="space-y-2">
              {showPlaces
                ? places.slice(0, 10).map((p) => (
                    <Card key={p.pageid} className="p-3">
                      <div className="text-sm font-medium">{p.title}</div>
                      <div className="mt-1 flex flex-wrap gap-2">
                        <Button asChild size="sm" variant="secondary">
                          <Link to={`/place/${encodeURIComponent(p.title)}`}>
                            View
                          </Link>
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (!user) return navigate('/auth')
                            navigate(
                              `/planner?destination=${encodeURIComponent(p.title)}&lat=${p.lat}&lon=${p.lon}`,
                            )
                          }}
                        >
                          <Sparkles className="mr-2 size-4" />
                          Plan
                        </Button>
                      </div>
                    </Card>
                  ))
                : null}

              {showHotels
                ? hotels.slice(0, 8).map((h) => (
                    <Card key={`${h.type}:${h.id}`} className="p-3">
                      <div className="text-sm font-medium">
                        {(h.tags?.['name:en'] && h.tags['name:en'].trim()) ||
                          (h.name && h.name.trim()) ||
                          (h.tags?.brand && h.tags.brand.trim()) ||
                          `Hotel ${String(h.id).slice(-4)}`}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(h.tags?.tourism ?? 'tourism') +
                          (searchCenter
                            ? ` · ${formatDistance(
                                distanceKm(
                                  { lat: searchCenter.lat, lon: searchCenter.lon },
                                  { lat: h.lat, lon: h.lon },
                                ),
                              )}`
                            : '')}
                      </div>
                    </Card>
                  ))
                : null}

              {showTransport
                ? transport
                    .map((t) => ({
                      t,
                      km: distanceKm(searchCenter, { lat: t.lat, lon: t.lon }),
                    }))
                    .sort((a, b) => a.km - b.km)
                    .slice(0, 10)
                    .map(({ t, km }) => (
                      <Card key={`${t.type}:${t.id}`} className="p-3">
                        <div className="text-sm font-medium">
                          {(t.tags?.['name:en'] && t.tags['name:en'].trim()) ||
                            (t.name && t.name.trim()) ||
                            (t.tags?.ref && t.tags.ref.trim()) ||
                            (t.tags?.local_ref && t.tags.local_ref.trim()) ||
                            `Transport ${String(t.id).slice(-4)}`}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {(t.tags?.highway ||
                            t.tags?.railway ||
                            t.tags?.aeroway ||
                            'transport')
                            .replaceAll('_', ' ')}{' '}
                          · {formatDistance(km)}
                        </div>
                      </Card>
                    ))
                : null}

              {showPois ? (
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="text-sm font-medium">Nearby POIs</div>
                    <div className="text-xs text-muted-foreground">
                      radius {(POI_RADIUS_METERS / 1000).toFixed(1)} km
                    </div>
                  </div>
                  {poisQ.isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                      <Skeleton className="h-16" />
                    </div>
                  ) : pois.length ? (
                    <div className="space-y-2">
                      {pois.slice(0, 10).map((p) => (
                        <Card key={`${p.type}:${p.id}`} className="p-3">
                          <div className="flex items-start gap-3">
                            {poiThumbsQ.data?.[String(p.id)] ? (
                              <img
                                src={poiThumbsQ.data[String(p.id)]!}
                                alt=""
                                loading="lazy"
                                className="mt-0.5 size-11 shrink-0 rounded-xl border border-border/70 object-cover"
                              />
                            ) : (
                              <div className="mt-0.5 size-11 shrink-0 rounded-xl border border-border/70 bg-background/30" />
                            )}
                            <div className="min-w-0">
                              <div className="truncate text-sm font-medium">
                                {p.name ?? 'Point of interest'}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                {(p.tags?.tourism ||
                                  p.tags?.historic ||
                                  p.tags?.leisure ||
                                  p.tags?.amenity ||
                                  'poi')
                                  .replaceAll('_', ' ')}{' '}
                                ·{' '}
                                {formatDistance(
                                  distanceKm(searchCenter, {
                                    lat: p.lat,
                                    lon: p.lon,
                                  }),
                                )}
                              </div>
                            </div>
                          </div>
                        </Card>
                      ))}
                    </div>
                  ) : null}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      <div className="relative overflow-hidden rounded-3xl border border-border/70 bg-card/20 shadow-[var(--shadow-soft)] lg:col-span-3">
        {showSearchArea ? (
          <div className="absolute left-1/2 top-3 z-[1000] -translate-x-1/2">
            <Button
              variant="secondary"
              onClick={() => setSearchCenter(mapCenter)}
            >
              Search this area
            </Button>
          </div>
        ) : null}

        <MapContainer
          key={`${baseMap}:${zoom}:${mapCenter.lat.toFixed(3)}:${mapCenter.lon.toFixed(3)}`}
          center={[mapCenter.lat, mapCenter.lon]}
          zoom={zoom}
          className="h-[75vh] w-full"
        >
          <TileLayer url={tile.url} attribution={tile.attribution} />
          <MapInvalidateSize />
          <MapEvents onMoved={setMapCenter} />

          {showPlaces
            ? places.map((p) => (
                <Marker
                  key={`p:${p.pageid}`}
                  position={[p.lat, p.lon]}
                  icon={pinPrimary}
                >
                  <Popup>
                    <div className="space-y-2">
                      <div className="font-medium">{p.title}</div>
                      <div className="flex gap-2">
                        <Link
                          className="text-sm text-primary underline underline-offset-4"
                          to={`/place/${encodeURIComponent(p.title)}`}
                        >
                          View details
                        </Link>
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            : null}

          {showHotels
            ? hotels.map((h) => (
                <Marker
                  key={`h:${h.type}:${h.id}`}
                  position={[h.lat, h.lon]}
                  icon={pinMuted}
                >
                  <Popup>
                    <div className="font-medium">{h.name ?? 'Hotel'}</div>
                  </Popup>
                </Marker>
              ))
            : null}

          {showTransport
            ? transport.map((t) => (
                <Marker
                  key={`t:${t.type}:${t.id}`}
                  position={[t.lat, t.lon]}
                  icon={pinMuted}
                >
                  <Popup>
                    <div className="font-medium">
                      {t.name ??
                        t.tags?.highway ??
                        t.tags?.railway ??
                        t.tags?.aeroway ??
                        'Transport'}
                    </div>
                  </Popup>
                </Marker>
              ))
            : null}

          {showPois
            ? pois.slice(0, 50).map((p) => (
                <Marker
                  key={`poi:${p.type}:${p.id}`}
                  position={[p.lat, p.lon]}
                  icon={pinMuted}
                >
                  <Popup>
                    <div className="space-y-1">
                      <div className="font-medium">
                        {p.name ?? 'Point of interest'}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {(p.tags?.tourism ||
                          p.tags?.historic ||
                          p.tags?.leisure ||
                          p.tags?.amenity ||
                          'poi')
                          .replaceAll('_', ' ')}
                      </div>
                    </div>
                  </Popup>
                </Marker>
              ))
            : null}
        </MapContainer>
      </div>
    </div>
  )
}
