import { fetchWithTimeout } from './http.js'

export async function getWeather(lat, lon) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    current_weather: 'true',
    hourly: 'temperature_2m,precipitation_probability,relativehumidity_2m,weathercode',
    timezone: 'auto',
  })
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`
  const res = await fetchWithTimeout(url, {}, 15000)
  if (!res.ok) throw new Error(`Open-Meteo failed (${res.status})`)
  const data = await res.json()
  return {
    current: data?.current_weather ?? null,
    hourly: data?.hourly ?? null,
  }
}

