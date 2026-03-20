/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
  readonly VITE_MAPTILER_KEY?: string
  readonly VITE_GROQ_API_KEY?: string
  readonly VITE_AI_MODEL?: string
  readonly VITE_MAPTILER_STYLE_DARK?: string
  readonly VITE_MAPTILER_STYLE_STREETS?: string
  readonly VITE_MAPTILER_STYLE_SATELLITE?: string
  readonly VITE_MAPTILER_STYLE_HYBRID?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
