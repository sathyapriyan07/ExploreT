import { supabase } from '@/services/supabase'

export type SavedPlace = {
  id: string
  user_id: string
  title: string
  lat: number
  lon: number
  image_url: string | null
}

export type TripRow = {
  id: string
  user_id: string
  destination: string
  itinerary: any
  created_at: string
}

export type PreferencesRow = {
  id: string
  user_id: string
  interests: any
  last_viewed: string | null
}

export async function getSavedPlaces(userId: string) {
  const { data, error } = await supabase
    .from('saved_places')
    .select('*')
    .eq('user_id', userId)
    .order('id', { ascending: false })
  if (error) throw error
  return (data ?? []) as SavedPlace[]
}

export async function savePlace(input: Omit<SavedPlace, 'id'>) {
  const { data, error } = await supabase
    .from('saved_places')
    .upsert(input, { onConflict: 'user_id,title' })
    .select('*')
    .single()
  if (error) throw error
  return data as SavedPlace
}

export async function deleteSavedPlace(id: string, userId: string) {
  const { error } = await supabase
    .from('saved_places')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function getTrips(userId: string) {
  const { data, error } = await supabase
    .from('trips')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return (data ?? []) as TripRow[]
}

export async function saveTrip(input: Omit<TripRow, 'id' | 'created_at'>) {
  const { data, error } = await supabase
    .from('trips')
    .insert(input)
    .select('*')
    .single()
  if (error) throw error
  return data as TripRow
}

export async function deleteTrip(id: string, userId: string) {
  const { error } = await supabase
    .from('trips')
    .delete()
    .eq('id', id)
    .eq('user_id', userId)
  if (error) throw error
}

export async function upsertPreferences(input: {
  user_id: string
  interests?: any
  last_viewed?: string | null
}) {
  const { data, error } = await supabase
    .from('preferences')
    .upsert(input, { onConflict: 'user_id' })
    .select('*')
    .single()
  if (error) throw error
  return data as PreferencesRow
}

export async function getPreferences(userId: string) {
  const { data, error } = await supabase
    .from('preferences')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle()
  if (error) throw error
  return (data ?? null) as PreferencesRow | null
}
