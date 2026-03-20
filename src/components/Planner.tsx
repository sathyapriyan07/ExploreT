import * as React from 'react'
import {
  DndContext,
  PointerSensor,
  useSensor,
  useSensors,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Sparkles, Save } from 'lucide-react'
import { useMutation } from '@tanstack/react-query'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { Itinerary, ItineraryDay } from '@/utils/itinerary'
import { saveTrip } from '@/services/db'
import { useAuth } from '@/context/auth'

function SortableItem({
  id,
  title,
  subtitle,
}: {
  id: string
  title: string
  subtitle?: string
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.7 : 1,
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex items-start gap-2 rounded-2xl border border-border/70 bg-background/30 p-3 transition-colors hover:bg-background/40"
    >
      <button
        className="mt-0.5 inline-flex cursor-grab items-center text-muted-foreground active:cursor-grabbing"
        {...attributes}
        {...listeners}
        type="button"
        aria-label="Drag to reorder"
      >
        <GripVertical className="size-4" />
      </button>
      <div className="min-w-0">
        <div className="truncate text-sm font-medium">{title}</div>
        {subtitle ? (
          <div className="truncate text-xs text-muted-foreground">{subtitle}</div>
        ) : null}
      </div>
    </div>
  )
}

export function Planner({
  itinerary,
  setItinerary,
  destination,
}: {
  itinerary: Itinerary | null
  setItinerary: (next: Itinerary | null) => void
  destination: string
}) {
  const { user } = useAuth()
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }))

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Sign in required')
      if (!itinerary) throw new Error('Generate a plan first')
      await saveTrip({
        user_id: user.id,
        destination,
        itinerary,
      })
    },
  })

  function onDragEnd(day: ItineraryDay, event: DragEndEvent) {
    const activeId = String(event.active.id)
    const overId = event.over ? String(event.over.id) : null
    if (!overId || activeId === overId) return

    const oldIndex = day.items.findIndex((i) => i.id === activeId)
    const newIndex = day.items.findIndex((i) => i.id === overId)
    if (oldIndex < 0 || newIndex < 0) return

    const nextDays = (itinerary?.days ?? []).map((d) =>
      d.day !== day.day ? d : { ...d, items: arrayMove(d.items, oldIndex, newIndex) },
    )
    setItinerary(itinerary ? { ...itinerary, days: nextDays } : null)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="text-sm font-medium">Itinerary</div>
          {itinerary?.interests?.length ? (
            <Badge variant="secondary">{itinerary.interests.join(', ')}</Badge>
          ) : null}
        </div>
        <Button
          variant="secondary"
          onClick={() => void saveMutation.mutateAsync()}
          disabled={saveMutation.isPending || !itinerary}
        >
          <Save className="mr-2 size-4" />
          Save trip
        </Button>
      </div>

      {saveMutation.error ? (
        <div className="text-sm text-destructive">
          {saveMutation.error instanceof Error ? saveMutation.error.message : 'Save failed'}
        </div>
      ) : null}

      {itinerary ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {itinerary.days.map((day) => (
            <Card key={day.day}>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">
                  Day {day.day}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <DndContext
                  sensors={sensors}
                  collisionDetection={closestCenter}
                  onDragEnd={(e) => onDragEnd(day, e)}
                >
                  <SortableContext
                    items={day.items.map((i) => i.id)}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-2">
                      {day.items.map((i) => (
                        <SortableItem key={i.id} id={i.id} title={i.title} subtitle={i.notes} />
                      ))}
                      {!day.items.length ? (
                        <div className="text-sm text-muted-foreground">No items</div>
                      ) : null}
                    </div>
                  </SortableContext>
                </DndContext>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6 text-center text-muted-foreground">
          <div className="mx-auto mb-2 flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Sparkles className="size-5" />
          </div>
          Generate a plan to start building your trip.
        </Card>
      )}
    </div>
  )
}
