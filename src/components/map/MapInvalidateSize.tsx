import * as React from 'react'
import { useMap } from 'react-leaflet'

export function MapInvalidateSize() {
  const map = useMap()

  React.useEffect(() => {
    // Leaflet sometimes measures size before layout settles (especially inside cards/grids).
    // A couple of deferred invalidations makes tile rendering consistent.
    const t1 = window.setTimeout(() => map.invalidateSize(), 0)
    const t2 = window.setTimeout(() => map.invalidateSize(), 250)
    return () => {
      window.clearTimeout(t1)
      window.clearTimeout(t2)
    }
  }, [map])

  return null
}

