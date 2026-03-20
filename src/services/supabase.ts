import { createClient } from '@supabase/supabase-js'

function getRequiredEnv(name: keyof ImportMetaEnv) {
  const value = import.meta.env[name]
  if (!value) {
    throw new Error(
      `Missing ${name}. Add it to your environment (e.g. .env.local).`,
    )
  }
  return value
}

export const supabase = createClient(
  getRequiredEnv('VITE_SUPABASE_URL'),
  getRequiredEnv('VITE_SUPABASE_ANON_KEY'),
  {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  },
)

