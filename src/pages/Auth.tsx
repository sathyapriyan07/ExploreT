import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Chrome, Lock, Mail } from 'lucide-react'

import { useAuth } from '@/context/auth'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

type Mode = 'signin' | 'signup'

export default function AuthPage() {
  const { signIn, signUp, signInWithGoogle } = useAuth()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  const [mode, setMode] = React.useState<Mode>('signin')
  const [email, setEmail] = React.useState('')
  const [password, setPassword] = React.useState('')
  const [error, setError] = React.useState<string | null>(null)
  const [pending, setPending] = React.useState(false)

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    setPending(true)
    setError(null)
    try {
      if (mode === 'signup') await signUp(email, password)
      else await signIn(email, password)
      navigate(searchParams.get('redirect') ?? '/', { replace: true })
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Authentication failed. Try again.'
      setError(msg)
    } finally {
      setPending(false)
    }
  }

  return (
    <div className="relative mx-auto max-w-md">
      <div className="pointer-events-none absolute -inset-10 -z-10 rounded-[2.5rem] bg-[radial-gradient(500px_220px_at_50%_0%,hsl(var(--primary)/0.25),transparent_65%)]" />

      <Card className="border-border/70 bg-card/75 shadow-[var(--shadow-soft)] backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">
            {mode === 'signup' ? 'Create account' : 'Welcome back'}
          </CardTitle>
          <div className="text-sm text-muted-foreground">
            Sign in to save places and trips.
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex gap-2">
            <Button
              type="button"
              variant={mode === 'signin' ? 'default' : 'secondary'}
              className="flex-1"
              onClick={() => setMode('signin')}
            >
              Sign in
            </Button>
            <Button
              type="button"
              variant={mode === 'signup' ? 'default' : 'secondary'}
              className="flex-1"
              onClick={() => setMode('signup')}
            >
              Sign up
            </Button>
          </div>

          <form className="space-y-3" onSubmit={onSubmit}>
            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Mail className="size-4" /> Email
              </span>
              <Input
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                type="email"
                autoComplete="email"
                required
              />
            </label>

            <label className="block text-sm">
              <span className="mb-1 flex items-center gap-2 text-muted-foreground">
                <Lock className="size-4" /> Password
              </span>
              <Input
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                type="password"
                autoComplete={
                  mode === 'signup' ? 'new-password' : 'current-password'
                }
                required
                minLength={6}
              />
            </label>

            {error ? (
              <div className="rounded-2xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            ) : null}

            <Button className="w-full" type="submit" disabled={pending}>
              {pending
                ? 'Please wait…'
                : mode === 'signup'
                  ? 'Create account'
                  : 'Sign in'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => void signInWithGoogle()}
            >
              <Chrome className="mr-2 size-4" />
              Continue with Google
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
