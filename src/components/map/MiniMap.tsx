import * as React from 'react'
import { MapContainer, Marker, Popup, Polyline, TileLayer } from 'react-leaflet'
import type { LatLngExpression } from 'leaflet'

import { getMapTileConfig, type BaseMapStyle } from '@/utils/map'
import { setupLeafletDefaultIcons } from '@/components/map/leafletSetup'
import { MapInvalidateSize } from '@/components/map/MapInvalidateSize'
import { createPinIcon } from '@/components/map/pinIcon'

type MarkerItem = {
  title: string
  lat: number
  lon: number
  variant?: 'primary' | 'muted'
}

export function MiniMap({
  center,
  markers,
  route,
  baseMap = 'dark',
}: {
  center: { lat: number; lon: number }
  markers: MarkerItem[]
  route?: Array<{ lat: number; lon: number }>
  baseMap?: BaseMapStyle
}) {
  React.useEffect(() => {
    setupLeafletDefaultIcons()
  }, [])

  const pinPrimary = React.useMemo(() => createPinIcon('primary'), [])
  const pinMuted = React.useMemo(() => createPinIcon('muted'), [])

  const tile = getMapTileConfig(baseMap)
  const polyline: LatLngExpression[] | null =
    route && route.length
      ? route.map((p) => [p.lat, p.lon] as LatLngExpression)
      : null

  return (
    <div className="overflow-hidden rounded-xl border">
      <MapContainer
        center={[center.lat, center.lon]}
        zoom={12}
        scrollWheelZoom={false}
        className="h-[320px] w-full"
      >
        <TileLayer url={tile.url} attribution={tile.attribution} />
        <MapInvalidateSize />
        {markers.map((m) => (
          <Marker
            key={`${m.title}:${m.lat}:${m.lon}`}
            position={[m.lat, m.lon]}
            icon={m.variant === 'muted' ? pinMuted : pinPrimary}
          >
            <Popup>{m.title}</Popup>
          </Marker>
        ))}
        {polyline ? <Polyline positions={polyline} /> : null}
      </MapContainer>
    </div>
  )
}
