import { Link } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

import { Card, CardContent } from '@/components/ui/card'
import { cn } from '@/lib/utils'

export function PlaceCard({
  title,
  description,
  imageUrl,
  className,
}: {
  title: string
  description?: string
  imageUrl?: string | null
  className?: string
}) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ type: 'spring', stiffness: 250, damping: 22 }}
      className={cn('group', className)}
    >
      <Card className="overflow-hidden">
        <Link to={`/place/${encodeURIComponent(title)}`} className="block">
        <div className="relative aspect-[16/10] overflow-hidden bg-muted">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.05]"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted/20" />
          )}
          <div className="absolute inset-0 ring-1 ring-white/10" />
          <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-background/95 via-background/40 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 p-3">
            <div className="line-clamp-1 text-sm font-semibold tracking-tight">
              {title}
            </div>
            {description ? (
              <div className="line-clamp-1 text-xs text-muted-foreground">
                {description}
              </div>
            ) : (
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <MapPin className="size-3" />
                Explore details
              </div>
            )}
          </div>
        </div>
        <CardContent className="p-3">
          <div className="line-clamp-2 text-sm text-muted-foreground">
            {description ?? 'Open the destination detail to explore nearby places and plan your trip.'}
          </div>
        </CardContent>
        </Link>
      </Card>
    </motion.div>
  )
}
