import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import {
  Globe2,
  Heart,
  Map,
  Menu,
  Moon,
  Search,
  Sparkles,
  Sun,
  Type,
  X,
} from 'lucide-react'
import { useEffect, useState, type ReactNode } from 'react'
import { AnimatePresence, motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useAuth } from '@/context/auth'
import { Chatbot } from '@/components/Chatbot'

type FontWeightMode = 'light' | 'regular' | 'black'
type ThemeMode = 'light' | 'dark'

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

function MobileNavItem({
  to,
  icon,
  label,
  onNavigate,
}: {
  to: string
  icon: ReactNode
  label: string
  onNavigate: () => void
}) {
  return (
    <NavLink
      to={to}
      onClick={onNavigate}
      className={({ isActive }) =>
        cn(
          'flex items-center gap-3 rounded-2xl border border-border/70 bg-background/50 px-4 py-3 text-sm text-foreground shadow-[var(--shadow-soft)] backdrop-blur transition-colors hover:bg-accent/40',
          isActive && 'bg-accent/50',
        )
      }
    >
      <span className="grid size-9 place-items-center rounded-2xl bg-accent/40 text-foreground">
        {icon}
      </span>
      <span className="font-medium">{label}</span>
    </NavLink>
  )
}

export function AppShell() {
  const { user, signOut } = useAuth()
  const location = useLocation()
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [themeMode, setThemeMode] = useState<ThemeMode>(() => {
    const value = localStorage.getItem('explorex-theme')
    if (value === 'light' || value === 'dark') return value
    return typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  })
  const [fontWeightMode, setFontWeightMode] = useState<FontWeightMode>(() => {
    const value = localStorage.getItem('explorex-font-weight')
    if (value === 'light' || value === 'regular' || value === 'black') return value
    return 'regular'
  })

  useEffect(() => {
    const root = document.documentElement
    if (themeMode === 'dark') root.classList.add('dark')
    else root.classList.remove('dark')
    localStorage.setItem('explorex-theme', themeMode)
  }, [themeMode])

  useEffect(() => {
    const root = document.documentElement
    root.classList.remove('font-weight-light', 'font-weight-regular', 'font-weight-black')
    root.classList.add(`font-weight-${fontWeightMode}`)
    localStorage.setItem('explorex-font-weight', fontWeightMode)
  }, [fontWeightMode])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    if (!mobileNavOpen) return
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previousOverflow
    }
  }, [mobileNavOpen])

  function toggleFontWeightMode() {
    setFontWeightMode((current) => {
      if (current === 'regular') return 'light'
      if (current === 'light') return 'black'
      return 'regular'
    })
  }

  function toggleThemeMode() {
    setThemeMode((current) => (current === 'dark' ? 'light' : 'dark'))
  }

  return (
    <div className="min-h-dvh bg-[radial-gradient(1200px_600px_at_20%_-10%,hsl(var(--primary)/0.18),transparent_60%),radial-gradient(900px_500px_at_80%_0%,hsl(var(--primary)/0.10),transparent_55%)]">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-background/70 backdrop-blur-xl">
        <div className="container-app flex h-16 items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileNavOpen(true)}
              aria-label="Open menu"
            >
              <Menu />
            </Button>

            <Link to="/" className="inline-flex items-center gap-2">
              <div className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                <Globe2 className="size-5" />
              </div>
              <div className="leading-tight">
                <div className="font-semibold tracking-tight">ExploreX</div>
                <div className="text-xs text-muted-foreground">Travel + AI</div>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            <NavItem to="/search" icon={<Search />} label="Search" />
            <NavItem to="/map" icon={<Map />} label="Map" />
            <NavItem to="/planner" icon={<Sparkles />} label="Planner" />
            <NavItem to="/saved" icon={<Heart />} label="Saved" />
          </nav>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleThemeMode}
              title={themeMode === 'dark' ? 'Theme: Dark' : 'Theme: Light'}
            >
              {themeMode === 'dark' ? <Moon /> : <Sun />}
              <span className="hidden sm:inline">
                {themeMode === 'dark' ? 'Dark' : 'Light'}
              </span>
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleFontWeightMode}
              title={`Typography: ${fontWeightMode}`}
            >
              <Type />
              <span className="hidden sm:inline">
                {fontWeightMode === 'regular'
                  ? 'Regular'
                  : fontWeightMode === 'light'
                    ? 'Light'
                    : 'Black'}
              </span>
            </Button>
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

      <AnimatePresence>
        {mobileNavOpen ? (
          <motion.div
            className="fixed inset-0 z-50 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onKeyDown={(event) => {
              if (event.key === 'Escape') setMobileNavOpen(false)
            }}
          >
            <div
              className="absolute inset-0 bg-black/50"
              onClick={() => setMobileNavOpen(false)}
            />
            <motion.aside
              role="dialog"
              aria-modal="true"
              className="absolute left-0 top-0 h-full w-[min(92vw,360px)] border-r border-border/70 bg-background/80 shadow-[var(--shadow-soft)] backdrop-blur-xl"
              initial={{ x: -24, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -24, opacity: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              <div className="flex h-16 items-center justify-between gap-3 border-b border-border/70 px-4">
                <div className="flex items-center gap-2">
                  <div className="grid size-9 place-items-center rounded-2xl bg-primary text-primary-foreground shadow-[var(--shadow-glow)]">
                    <Globe2 className="size-5" />
                  </div>
                  <div className="leading-tight">
                    <div className="font-semibold tracking-tight">ExploreX</div>
                    <div className="text-xs text-muted-foreground">Menu</div>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => setMobileNavOpen(false)}
                  aria-label="Close menu"
                >
                  <X />
                </Button>
              </div>

              <div className="flex h-[calc(100%-4rem)] flex-col gap-4 overflow-auto p-4">
                <div className="grid gap-2">
                  <MobileNavItem
                    to="/search"
                    icon={<Search className="size-5" />}
                    label="Search"
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                  <MobileNavItem
                    to="/map"
                    icon={<Map className="size-5" />}
                    label="Map"
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                  <MobileNavItem
                    to="/planner"
                    icon={<Sparkles className="size-5" />}
                    label="Planner"
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                  <MobileNavItem
                    to="/saved"
                    icon={<Heart className="size-5" />}
                    label="Saved"
                    onNavigate={() => setMobileNavOpen(false)}
                  />
                </div>

                <div className="grid gap-2 pt-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={toggleThemeMode}
                  >
                    {themeMode === 'dark' ? <Moon /> : <Sun />}
                    Theme: {themeMode === 'dark' ? 'Dark' : 'Light'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    className="justify-start"
                    onClick={toggleFontWeightMode}
                  >
                    <Type />
                    Typography:{' '}
                    {fontWeightMode === 'regular'
                      ? 'Regular'
                      : fontWeightMode === 'light'
                        ? 'Light'
                        : 'Black'}
                  </Button>
                </div>

                <div className="mt-auto pt-2">
                  {user ? (
                    <Button
                      variant="secondary"
                      className="w-full justify-center"
                      onClick={() => void signOut()}
                    >
                      Sign out
                    </Button>
                  ) : (
                    <Button
                      asChild
                      className="w-full justify-center"
                      onClick={() => setMobileNavOpen(false)}
                    >
                      <Link to="/auth">Sign in</Link>
                    </Button>
                  )}
                </div>
              </div>
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>

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
