export type BaseMapStyle = 'streets' | 'satellite' | 'hybrid' | 'dark'

function maptilerAttribution() {
  return (
    '&copy; <a href="https://www.maptiler.com/copyright/" target="_blank" rel="noreferrer">MapTiler</a> ' +
    '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>'
  )
}

export function hasMapTiler() {
  return Boolean(import.meta.env.VITE_MAPTILER_KEY)
}

export function getMapTileConfig(style: BaseMapStyle = 'dark') {
  const key = import.meta.env.VITE_MAPTILER_KEY
  if (key) {
    const styleIds = {
      dark: import.meta.env.VITE_MAPTILER_STYLE_DARK || 'darkmatter',
      streets: import.meta.env.VITE_MAPTILER_STYLE_STREETS || 'streets',
      satellite: import.meta.env.VITE_MAPTILER_STYLE_SATELLITE || 'satellite',
      hybrid: import.meta.env.VITE_MAPTILER_STYLE_HYBRID || 'hybrid',
    } as const

    const id = styleIds[style]
    const ext = style === 'satellite' ? 'jpg' : 'png'
    return {
      url: `https://api.maptiler.com/maps/${id}/{z}/{x}/{y}.${ext}?key=${key}`,
      attribution: maptilerAttribution(),
      provider: 'maptiler' as const,
    }
  }

  // Fallback: OSM Streets only (no satellite/hybrid available without a provider key)
  return {
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution:
      '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer">OpenStreetMap</a>',
    provider: 'osm' as const,
  }
}
