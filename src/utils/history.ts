const KEY = 'explorex:viewed'

export type ViewedPlace = { title: string; at: number }

export function addViewedPlace(title: string) {
  const current = getViewedPlaces()
  const next: ViewedPlace[] = [
    { title, at: Date.now() },
    ...current.filter((x) => x.title !== title),
  ].slice(0, 25)
  localStorage.setItem(KEY, JSON.stringify(next))
  return next
}

export function getViewedPlaces(): ViewedPlace[] {
  try {
    const raw = localStorage.getItem(KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as ViewedPlace[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export function getLastViewedPlace(): string | null {
  return getViewedPlaces()[0]?.title ?? null
}

