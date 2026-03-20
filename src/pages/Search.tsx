import * as React from 'react'
import { useSearchParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { Search } from 'lucide-react'

import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { PlaceCard } from '@/components/PlaceCard'
import { useDebounce } from '@/hooks/useDebounce'
import { api } from '@/services/api'
import { stripHtml } from '@/utils/text'

export default function SearchPage() {
  const [params, setParams] = useSearchParams()
  const initial = params.get('q') ?? ''
  const category = params.get('category')

  const [query, setQuery] = React.useState(initial)
  const debounced = useDebounce(query, 700)

  React.useEffect(() => {
    const next = new URLSearchParams(params)
    if (debounced.trim()) next.set('q', debounced.trim())
    else next.delete('q')
    setParams(next, { replace: true })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debounced])

  const effective = (debounced || category || '').trim()

  const { data, isLoading, error } = useQuery({
    queryKey: ['wikiSearch', effective],
    queryFn: () => api.search(category ? `${category} travel` : effective),
    enabled: effective.length >= 3 || Boolean(category),
    placeholderData: (prev) => prev,
  })

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">
          Search destinations
        </h1>
        <p className="mt-1 text-muted-foreground">
          Type a place name and open details to explore nearby spots, hotels,
          transport, and AI planning.
        </p>
      </div>

      <div className="relative">
        <Search className="pointer-events-none absolute left-4 top-3.5 size-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search: Bali, Paris, Ladakh…"
          className="pl-11"
        />
      </div>

      {error ? (
        <Card className="p-4 text-sm text-destructive">
          {error instanceof Error ? error.message : 'Search failed'}
        </Card>
      ) : null}

      {isLoading ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton key={idx} className="h-60" />
          ))}
        </div>
      ) : data?.length ? (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {data.map((r) => (
            <PlaceCard
              key={r.title}
              title={r.title}
              description={stripHtml(r.description ?? r.snippet)}
              imageUrl={null}
            />
          ))}
        </div>
      ) : effective ? (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur-xl">
          No results. Try a broader query (e.g. “Tokyo”, “Kerala”, “Swiss Alps”).
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-card/70 p-8 text-center text-muted-foreground shadow-[var(--shadow-soft)] backdrop-blur-xl">
          Start typing to search Wikipedia.
        </div>
      )}
    </div>
  )
}
