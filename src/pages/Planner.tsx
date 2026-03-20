import * as React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Sparkles } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Planner } from '@/components/Planner'
import { MiniMap } from '@/components/map/MiniMap'
import { wikiNearbyPlaces, wikiSummary } from '@/services/wiki'
import { aiChat, safeJsonParse } from '@/services/ai'
import { generateItineraryHeuristic, type Itinerary } from '@/utils/itinerary'

const INTERESTS = [
  'food',
  'history',
  'nature',
  'shopping',
  'nightlife',
  'family',
  'adventure',
]

type AiItinerary = {
  days?: Array<{ day: number; items: Array<{ title: string }> }>
}

export default function PlannerPage() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()

  const initialDestination = params.get('destination') ?? 'Kyoto'
  const [destination, setDestination] = React.useState(initialDestination)
  const [days, setDays] = React.useState(Number(params.get('days') ?? 3))
  const [interests, setInterests] = React.useState<string[]>([])
  const [itinerary, setItinerary] = React.useState<Itinerary | null>(null)
  const [aiMode, setAiMode] = React.useState(false)
  const [aiError, setAiError] = React.useState<string | null>(null)
  const [aiPending, setAiPending] = React.useState(false)

  const summaryQ = useQuery({
    queryKey: ['wikiSummary', destination],
    queryFn: () => wikiSummary(destination),
    enabled: destination.trim().length >= 2,
  })

  const coords = summaryQ.data?.coordinates ?? null

  const nearbyQ = useQuery({
    queryKey: ['plannerNearby', coords?.lat, coords?.lon],
    queryFn: () => wikiNearbyPlaces(coords!.lat, coords!.lon, 20000, 40),
    enabled: Boolean(coords),
  })

  React.useEffect(() => {
    const next = new URLSearchParams(params)
    next.set('destination', destination)
    next.set('days', String(days))
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destination, days])

  function toggleInterest(i: string) {
    setInterests((prev) =>
      prev.includes(i) ? prev.filter((x) => x !== i) : [...prev, i],
    )
  }

  async function generate() {
    setAiError(null)
    const places = nearbyQ.data ?? []
    if (!places.length) return

    if (!aiMode) {
      setItinerary(
        generateItineraryHeuristic({
          destination,
          days,
          interests,
          places,
        }),
      )
      return
    }

    setAiPending(true)
    try {
      const system = `You are ExploreX, a travel itinerary planner. Return ONLY valid JSON.\n\nSchema:\n{ \"days\": [ { \"day\": 1, \"items\": [ { \"title\": \"Place name\" } ] } ] }\n\nRules:\n- Exactly ${days} days\n- 3-5 items per day\n- Use place titles from the candidate list when possible\n- No markdown, no extra keys`

      const candidates = places.slice(0, Math.min(30, places.length)).map((p) => p.title)

      const content = await aiChat([
        { role: 'system', content: system },
        {
          role: 'user',
          content: `Destination: ${destination}\nInterests: ${interests.join(', ') || 'general'}\nCandidate places:\n${candidates.join('\n')}`,
        },
      ])

      const parsed = safeJsonParse<AiItinerary>(content)
      if (!parsed?.days?.length) throw new Error('AI did not return a valid itinerary JSON')

      const pickedTitles = parsed.days.flatMap((d) => d.items.map((i) => i.title))
      const picked = pickedTitles
        .map((t) => places.find((p) => p.title.toLowerCase() === t.toLowerCase()))
        .filter(Boolean)

      setItinerary(
        generateItineraryHeuristic({
          destination,
          days,
          interests,
          places: picked.length ? (picked as any) : places,
        }),
      )
    } catch (e) {
      setAiError(e instanceof Error ? e.message : 'AI generation failed')
    } finally {
      setAiPending(false)
    }
  }

  const routePoints =
    itinerary?.days.flatMap((d) => d.items.map((i) => ({ lat: i.lat, lon: i.lon }))) ??
    []

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trip planner</h1>
          <p className="mt-1 text-muted-foreground">
            Generate a day-wise itinerary, reorder items, and save the trip.
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/map')}>
          View on map
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Plan settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pt-0">
          <div className="grid gap-3 md:grid-cols-3">
            <label className="block text-sm">
              <div className="mb-1 text-muted-foreground">Destination</div>
              <Input
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="e.g. Kyoto"
              />
            </label>
            <label className="block text-sm">
              <div className="mb-1 text-muted-foreground">Days</div>
              <Input
                value={String(days)}
                onChange={(e) => setDays(Number(e.target.value))}
                type="number"
                min={1}
                max={14}
              />
            </label>
            <div className="flex items-end gap-2">
              <Button
                className="w-full"
                onClick={() => void generate()}
                disabled={aiPending || summaryQ.isLoading || nearbyQ.isLoading}
              >
                <Sparkles className="mr-2 size-4" />
                {aiPending ? 'Generating…' : 'Generate'}
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 text-sm text-muted-foreground">Interests:</div>
            {INTERESTS.map((i) => (
              <button
                key={i}
                type="button"
                onClick={() => toggleInterest(i)}
                className="rounded-md"
              >
                <Badge variant={interests.includes(i) ? 'default' : 'secondary'}>
                  {i}
                </Badge>
              </button>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant={aiMode ? 'default' : 'secondary'}
              onClick={() => setAiMode((v) => !v)}
            >
              Use AI (Bytez)
            </Button>
            <div className="text-xs text-muted-foreground">
              AI uses `/api/chat` proxy; heuristic works offline.
            </div>
          </div>

          {aiError ? (
            <div className="text-sm text-destructive">{aiError}</div>
          ) : null}
        </CardContent>
      </Card>

      {summaryQ.isLoading ? (
        <Skeleton className="h-80" />
      ) : coords ? (
        <MiniMap
          center={coords}
          markers={[
            { title: destination, lat: coords.lat, lon: coords.lon, variant: 'primary' },
            ...(nearbyQ.data ?? []).slice(0, 10).map((p) => ({
              title: p.title,
              lat: p.lat,
              lon: p.lon,
              variant: 'muted' as const,
            })),
          ]}
          route={routePoints}
        />
      ) : null}

      <Planner
        itinerary={itinerary}
        setItinerary={setItinerary}
        destination={destination}
      />
    </div>
  )
}
