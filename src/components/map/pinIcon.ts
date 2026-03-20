import L from 'leaflet'

type PinVariant = 'primary' | 'muted'

function pinSvg(fill: string) {
  // Simple pin svg (avoids Leaflet's default image assets, which can break under bundlers).
  return `
<svg width="36" height="36" viewBox="0 0 36 36" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <path d="M18 33s10-9.6 10-18A10 10 0 1 0 8 15c0 8.4 10 18 10 18Z" fill="${fill}" />
  <path d="M18 33s10-9.6 10-18A10 10 0 1 0 8 15c0 8.4 10 18 10 18Z" stroke="rgba(255,255,255,0.45)" stroke-width="1.2"/>
  <circle cx="18" cy="15" r="4.3" fill="rgba(0,0,0,0.35)" />
  <circle cx="18" cy="15" r="3.2" fill="rgba(255,255,255,0.9)" />
</svg>`
}

export function createPinIcon(variant: PinVariant = 'primary') {
  const fill =
    variant === 'primary' ? 'hsl(210 90% 60%)' : 'hsl(215 16% 55%)'

  return L.divIcon({
    className: 'explorex-pin-icon',
    html: pinSvg(fill),
    iconSize: [36, 36],
    iconAnchor: [18, 34],
    popupAnchor: [0, -28],
  })
}

