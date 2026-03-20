import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { Globe2, Heart, Map, Search, Sparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth'
import { Chatbot } from '@/components/Chatbot'

function NavItem({
  to,
  icon,
  label,
}: {
  to: string
  icon: ReactNode
  label: string
}) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-2 rounded-2xl px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent/40 hover:text-foreground',
          isActive && 'bg-accent/50 text-foreground',
        )
      }
    >
      {icon}
      <span className="hidden sm:inline">{label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(var(--primary)/0.18),transparent_60%),radial-gradient(900px_500px_at_80%_0%,hsl(var(--primary)/0.10),transparent_55%)]">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-background/55 backdrop-blur-xl">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <Link to="/" className="inline-flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
              <Globe2 className="size-5" />
            </div>
            <div className="leading-tight">
              <div className="font-semibold tracking-tight">ExploreX</div>
              <div className="text-xs text-muted-foreground">Travel + AI</div>
            </div>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/search" icon={<Search />} label="Search" />
            <NavItem to="/map" icon={<Map />} label="Map" />
            <NavItem to="/planner" icon={<Sparkles />} label="Planner" />
            <NavItem to="/saved" icon={<Heart />} label="Saved" />
          </nav>

          <div className="flex items-center gap-2">
            {user ? (
              <Button variant="secondary" onClick={() => void signOut()}>
                Sign out
              </Button>
            ) : (
              <Button asChild>
                <Link to="/auth">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </header>

      <main className="container-app py-10 md:py-12">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 14, filter: 'blur(6px)' }}
            animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -10, filter: 'blur(6px)' }}
            transition={{ duration: 0.28, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      <Chatbot />
    </div>
  )
}
