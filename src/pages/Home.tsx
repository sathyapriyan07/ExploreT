import { Link, useNavigate } from 'react-router-dom'
import { ArrowRight, Compass, MapPin, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'
import { useQuery } from '@tanstack/react-query'

import heroImg from '@/assets/hero.png'
import { PlaceCard } from '@/components/PlaceCard'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardTitle } from '@/components/ui/card'
import { FeaturedSpotlight } from '@/components/ui/feature-spotlight'
import { getLastViewedPlace } from '@/utils/history'
import { wikiNearbyPlaces, wikiSummary } from '@/services/wiki'
import { api } from '@/services/api'

const categories = [
  {
    key: 'hill',
    label: 'Hills',
    hint: 'Himalayas, Alps, Andes',
    image:
      'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1600&q=80',
  },
  {
    key: 'beach',
    label: 'Beaches',
    hint: 'Sunsets, surf, islands',
    image:
      'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80',
  },
  {
    key: 'historical',
    label: 'Historical',
    hint: 'Ruins, forts, museums',
    image:
      'https://images.unsplash.com/photo-1526772662000-3f88f10405ff?auto=format&fit=crop&w=1600&q=80',
  },
]

const trending = [
  // South India first
  { title: 'Kerala', subtitle: 'Backwaters, beaches, hill stations' },
  { title: 'Tamil Nadu', subtitle: 'Temples, heritage, coastline' },
  { title: 'Varkala', subtitle: 'Cliffs, cafes, Arabian Sea' },
  { title: 'Munnar', subtitle: 'Tea gardens, misty hills' },
  { title: 'Goa', subtitle: 'Beaches, nightlife, sunsets' },
  { title: 'Kyoto', subtitle: 'Temples, food, cherry blossoms' },
  { title: 'Reykjavík', subtitle: 'Northern lights, geothermal' },
  { title: 'Cape Town', subtitle: 'Ocean drives, Table Mountain' },
  { title: 'Jaipur', subtitle: 'Forts, bazaars, palaces' },
]

export default function HomePage() {
  const navigate = useNavigate()
  const lastViewed = getLastViewedPlace()

  async function getWikiThumb(title: string) {
    try {
      const s = await api.wiki(title)
      if (s.thumbnail) return s.thumbnail
    } catch {
      // Fall back to direct Wikipedia fetch (works even on static hosting without /api routes).
    }

    try {
      const s = await wikiSummary(title)
      return s.thumbnail ?? null
    } catch {
      return null
    }
  }

  const lastSummaryQ = useQuery({
    queryKey: ['homeLastSummary', lastViewed],
    queryFn: () => wikiSummary(lastViewed!),
    enabled: Boolean(lastViewed),
  })

  const coords = lastSummaryQ.data?.coordinates ?? null
  const becauseQ = useQuery({
    queryKey: ['homeBecause', coords?.lat, coords?.lon],
    queryFn: () => wikiNearbyPlaces(coords!.lat, coords!.lon, 25000, 12),
    enabled: Boolean(coords),
  })

  const trendingThumbsQ = useQuery({
    queryKey: ['homeTrendingThumbs'],
    queryFn: async () => {
      const entries = await Promise.all(
        trending.map(async (t) => {
          const thumb = await getWikiThumb(t.title)
          return [t.title, thumb] as const
        }),
      )
      return Object.fromEntries(entries) as Record<string, string | null>
    },
    staleTime: 6 * 60 * 60 * 1000,
  })

  const becauseThumbsQ = useQuery({
    queryKey: ['homeBecauseThumbs', becauseQ.data?.[0]?.pageid],
    queryFn: async () => {
      const items = (becauseQ.data ?? []).slice(0, 6)
      const entries = await Promise.all(
        items.map(async (p) => {
          const thumb = await getWikiThumb(p.title)
          return [p.title, thumb] as const
        }),
      )
      return Object.fromEntries(entries) as Record<string, string | null>
    },
    enabled: Boolean(becauseQ.data?.length),
    staleTime: 6 * 60 * 60 * 1000,
  })

  const spotlightTitle = lastSummaryQ.data?.title ?? 'Goa'
  const spotlightImage =
    lastSummaryQ.data?.thumbnail ??
    'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1600&q=80'
  const spotlightDescription =
    lastSummaryQ.data?.extract ??
    'Beaches, nightlife, and unforgettable sunsets — discover the best spots with maps and AI planning.'

  return (
    <div className="space-y-12">
      <section className="relative -mx-4 overflow-hidden rounded-3xl border border-white/10 bg-card/70 shadow-[var(--shadow-soft)] backdrop-blur-xl md:-mx-6">
        <img
          src={heroImg}
          alt=""
          className="absolute inset-0 h-full w-full object-cover opacity-35 saturate-[1.1]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/75 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent" />
        <div className="relative p-8 md:p-14">
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="max-w-3xl text-4xl font-semibold tracking-tight md:text-7xl"
          >
            Cinematic travel discovery, with maps and AI planning.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="mt-5 max-w-2xl text-muted-foreground md:text-xl"
          >
            Search any destination, explore nearby places and hotels, build a
            day-wise itinerary, and save everything to your account.
          </motion.p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild>
              <Link to="/search">
                <Compass className="mr-2 size-4" />
                Explore places
              </Link>
            </Button>
            <Button asChild variant="secondary">
              <Link to="/planner">
                <Sparkles className="mr-2 size-4" />
                Plan a trip
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to="/map">
                <MapPin className="mr-2 size-4" />
                Open map
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Feature spotlight
        </h2>
        <FeaturedSpotlight
          title1="Explore"
          title2={spotlightTitle}
          description={spotlightDescription}
          image={spotlightImage}
          index="01"
          onClick={() => navigate(`/place/${encodeURIComponent(spotlightTitle)}`)}
        />
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold tracking-tight">Trending</h2>
          <Button asChild variant="link" className="px-0">
            <Link to="/search">
              Browse all <ArrowRight className="ml-1 size-4" />
            </Link>
          </Button>
        </div>
        <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 scrollbar-hide scroll-smooth md:-mx-6 md:px-6">
          {trending.map((item) => (
            <Card
              key={item.title}
              className="group min-w-[260px] shrink-0 snap-start overflow-hidden md:min-w-[320px]"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-muted/30">
                {trendingThumbsQ.data?.[item.title] ? (
                  <img
                    src={trendingThumbsQ.data[item.title]!}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover opacity-85 transition-transform duration-700 group-hover:scale-[1.05]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-gradient-to-br from-muted/50 to-background/20" />
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <CardTitle className="text-base">{item.title}</CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">
                    {item.subtitle}
                  </div>
                </div>
              </div>
              <CardContent className="pt-4">
                <Button asChild variant="secondary" className="w-full">
                  <Link to={`/place/${encodeURIComponent(item.title)}`}>
                    View details
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">Categories</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map((c) => (
            <Card key={c.key} className="group overflow-hidden">
              <div className="relative aspect-[16/8] overflow-hidden bg-muted/30">
                <img
                  src={c.image}
                  alt=""
                  loading="lazy"
                  className="h-full w-full object-cover opacity-80 transition-transform duration-700 group-hover:scale-[1.05]"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/35 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4">
                  <CardTitle className="text-base">{c.label}</CardTitle>
                  <div className="mt-1 text-sm text-muted-foreground">{c.hint}</div>
                </div>
              </div>
              <CardContent className="pt-4">
                <Button asChild variant="outline" className="w-full">
                  <Link to={`/search?category=${encodeURIComponent(c.key)}`}>
                    Explore {c.label.toLowerCase()}
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {lastViewed && becauseQ.data?.length ? (
        <section className="space-y-4">
          <h2 className="text-xl font-semibold tracking-tight">
            Because you viewed "{lastViewed}"
          </h2>
          <div className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto overflow-y-hidden px-4 pb-2 scrollbar-hide scroll-smooth md:-mx-6 md:px-6">
            {becauseQ.data.slice(0, 10).map((p) => (
              <div
                key={p.pageid}
                className="min-w-[260px] shrink-0 snap-start md:min-w-[320px]"
              >
                <PlaceCard
                  title={p.title}
                  description={`~${Math.round(p.dist / 100) / 10} km away`}
                  imageUrl={becauseThumbsQ.data?.[p.title] ?? null}
                />
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  )
}
