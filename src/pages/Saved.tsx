import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Link, useNavigate } from 'react-router-dom'
import { Trash2, Sparkles } from 'lucide-react'

import { useAuth } from '@/context/auth'
import {
  deleteSavedPlace,
  deleteTrip,
  getSavedPlaces,
  getTrips,
} from '@/services/db'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'

export default function SavedPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const savedQ = useQuery({
    queryKey: ['savedPlaces', user?.id],
    queryFn: () => getSavedPlaces(user!.id),
    enabled: Boolean(user),
  })

  const tripsQ = useQuery({
    queryKey: ['trips', user?.id],
    queryFn: () => getTrips(user!.id),
    enabled: Boolean(user),
  })

  const delSaved = useMutation({
    mutationFn: (id: string) => deleteSavedPlace(id, user!.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['savedPlaces', user?.id] })
    },
  })

  const delTrip = useMutation({
    mutationFn: (id: string) => deleteTrip(id, user!.id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['trips', user?.id] })
    },
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Saved</h1>
        <p className="mt-1 text-muted-foreground">
          Your saved places and trip plans.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Saved places</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {savedQ.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : savedQ.data?.length ? (
              <div className="space-y-2">
                {savedQ.data.map((p) => (
                  <div
                    key={p.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-background/30 p-3 transition-colors hover:bg-background/40"
                  >
                    <div className="min-w-0">
                      <Link
                        to={`/place/${encodeURIComponent(p.title)}`}
                        className="truncate text-sm font-medium hover:underline"
                      >
                        {p.title}
                      </Link>
                      <div className="text-xs text-muted-foreground">
                        {p.lat.toFixed(3)}, {p.lon.toFixed(3)}
                      </div>
                    </div>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => delSaved.mutate(p.id)}
                      aria-label="Delete saved place"
                    >
                      <Trash2 className="size-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No saved places yet. Open a destination and tap “Save place”.
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Trips</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            {tripsQ.isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-16" />
                <Skeleton className="h-16" />
              </div>
            ) : tripsQ.data?.length ? (
              <div className="space-y-2">
                {tripsQ.data.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-background/30 p-3 transition-colors hover:bg-background/40"
                  >
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">
                        {t.destination}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(t.created_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() =>
                          navigate(
                            `/planner?destination=${encodeURIComponent(t.destination)}&days=${(t.itinerary?.days?.length ?? 3)}`,
                          )
                        }
                      >
                        <Sparkles className="mr-2 size-4" />
                        Open
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => delTrip.mutate(t.id)}
                        aria-label="Delete trip"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                No trips saved yet. Generate a plan and hit “Save trip”.
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
