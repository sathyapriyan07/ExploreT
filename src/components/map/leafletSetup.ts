import L from 'leaflet'

// Fix default marker icons under modern bundlers (Vite).
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import iconUrl from 'leaflet/dist/images/marker-icon.png'
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import shadowUrl from 'leaflet/dist/images/marker-shadow.png'

export function setupLeafletDefaultIcons() {
  L.Icon.Default.mergeOptions({
    iconRetinaUrl,
    iconUrl,
    shadowUrl,
  })
}

