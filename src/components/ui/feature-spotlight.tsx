import { ArrowRight, Sparkles } from 'lucide-react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils'

export type FeaturedSpotlightProps = {
  title1: string
  title2: string
  description: string
  image: string
  index?: string
  onClick?: () => void
  className?: string
}

export function FeaturedSpotlight({
  title1,
  title2,
  description,
  image,
  index = '01',
  onClick,
  className,
}: FeaturedSpotlightProps) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ y: -2 }}
      whileTap={{ scale: 0.99 }}
      transition={{ type: 'spring', stiffness: 260, damping: 22 }}
      className={cn(
        'group relative w-full overflow-hidden rounded-3xl border border-border/70 bg-card/70 text-left shadow-[var(--shadow-soft)] backdrop-blur-xl outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background',
        className,
      )}
    >
      <div className="absolute inset-0">
        <img
          src={image}
          alt=""
          loading="lazy"
          className="h-full w-full object-cover opacity-35 transition-transform duration-500 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent" />
      </div>

      <div className="relative grid gap-6 p-7 md:grid-cols-5 md:gap-10 md:p-12">
        <div className="md:col-span-3">
          <div className="mb-4 flex items-center gap-3">
            <div className="inline-flex items-center gap-2 rounded-full border bg-background/40 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3.5" />
              Featured
            </div>
            <div className="text-xs text-muted-foreground">{index}</div>
          </div>

          <div className="text-3xl font-semibold tracking-tight md:text-5xl">
            <span className="text-foreground">{title1}</span>{' '}
            <span className="text-foreground">{title2}</span>
          </div>
          <p className="mt-3 max-w-xl text-sm text-muted-foreground md:text-base">
            {description}
          </p>

          <div className="mt-6 inline-flex items-center gap-2 text-sm font-medium text-primary">
            View details <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>

        <div className="md:col-span-2">
          <div className="aspect-[16/11] overflow-hidden rounded-xl border bg-muted/30">
            <img
              src={image}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </motion.button>
  )
}
