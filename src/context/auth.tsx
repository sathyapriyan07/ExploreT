import React from 'react'
import type { Session, User } from '@supabase/supabase-js'

import { supabase } from '@/services/supabase'

type AuthContextValue = {
  user: User | null
  session: Session | null
  loading: boolean
  signUp: (email: string, password: string) => Promise<void>
  signIn: (email: string, password: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined)

async function ensureUserRow(user: User) {
  try {
    await supabase.from('users').upsert({ id: user.id, email: user.email })
  } catch {
    // best-effort; RLS/policies may block until configured
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = React.useState<Session | null>(null)
  const [user, setUser] = React.useState<User | null>(null)
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    let mounted = true
    supabase.auth
      .getSession()
      .then(({ data }) => {
        if (!mounted) return
        setSession(data.session ?? null)
        setUser(data.session?.user ?? null)
      })
      .finally(() => mounted && setLoading(false))

    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next)
      setUser(next?.user ?? null)
      if (next?.user) void ensureUserRow(next.user)
    })

    return () => {
      mounted = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      loading,
      async signUp(email, password) {
        const { error, data } = await supabase.auth.signUp({ email, password })
        if (error) throw error
        if (data.user) await ensureUserRow(data.user)
      },
      async signIn(email, password) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
        if (data.user) await ensureUserRow(data.user)
      },
      async signInWithGoogle() {
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'google',
          options: { redirectTo: window.location.origin },
        })
        if (error) throw error
      },
      async signOut() {
        const { error } = await supabase.auth.signOut()
        if (error) throw error
      },
    }),
    [user, session, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = React.useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}

