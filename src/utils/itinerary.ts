import type { WikiNearbyPlace } from '@/services/wiki'

export type ItineraryItem = {
  id: string
  title: string
  lat: number
  lon: number
  notes?: string
}

export type ItineraryDay = {
  day: number
  items: ItineraryItem[]
}

export type Itinerary = {
  destination: string
  interests: string[]
  generated_at: string
  days: ItineraryDay[]
}

function uid() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16)
}

export function generateItineraryHeuristic(input: {
  destination: string
  days: number
  interests: string[]
  places: WikiNearbyPlace[]
}): Itinerary {
  const days = Math.max(1, Math.min(14, Math.floor(input.days)))
  const perDay = 4
  const take = Math.min(input.places.length, days * perDay)
  const selected = input.places.slice(0, take)

  const dayBuckets: ItineraryDay[] = Array.from({ length: days }).map((_, i) => ({
    day: i + 1,
    items: [],
  }))

  selected.forEach((p, idx) => {
    const d = dayBuckets[idx % days]
    d.items.push({
      id: uid(),
      title: p.title,
      lat: p.lat,
      lon: p.lon,
      notes:
        input.interests.length ? `Focus: ${input.interests.join(', ')}` : undefined,
    })
  })

  return {
    destination: input.destination,
    interests: input.interests,
    generated_at: new Date().toISOString(),
    days: dayBuckets,
  }
}

