import { CloudRain, CloudSun, Cloudy, Droplets, Wind } from 'lucide-react'

import type { WeatherBundle } from '@/services/api'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

function weatherLabel(code?: number) {
  if (code === undefined || code === null) return { label: 'Weather', icon: Cloudy }
  // Open-Meteo weather codes (simplified)
  if (code === 0) return { label: 'Clear', icon: CloudSun }
  if ([1, 2, 3].includes(code)) return { label: 'Cloudy', icon: Cloudy }
  if ([45, 48].includes(code)) return { label: 'Fog', icon: Cloudy }
  if ([51, 53, 55, 56, 57].includes(code)) return { label: 'Drizzle', icon: CloudRain }
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code))
    return { label: 'Rain', icon: CloudRain }
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { label: 'Snow', icon: Cloudy }
  if ([95, 96, 99].includes(code)) return { label: 'Storm', icon: CloudRain }
  return { label: 'Weather', icon: Cloudy }
}

function pickNowIndex(times?: string[]) {
  if (!times?.length) return -1
  const now = Date.now()
  let best = 0
  let bestDiff = Number.POSITIVE_INFINITY
  for (let i = 0; i < times.length; i++) {
    const t = Date.parse(times[i]!)
    const diff = Math.abs(t - now)
    if (diff < bestDiff) {
      bestDiff = diff
      best = i
    }
  }
  return best
}

export function WeatherWidget({ data }: { data: WeatherBundle }) {
  const current = data.current
  const hourly = data.hourly

  const nowIdx = pickNowIndex(hourly?.time)
  const humidity =
    nowIdx >= 0 ? hourly?.relativehumidity_2m?.[nowIdx] : undefined
  const rain =
    nowIdx >= 0 ? hourly?.precipitation_probability?.[nowIdx] : undefined
  const code =
    current?.weathercode ??
    (nowIdx >= 0 ? hourly?.weathercode?.[nowIdx] : undefined)

  const meta = weatherLabel(code)
  const Icon = meta.icon

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Weather</CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
            <Icon className="size-5" />
          </div>
          <div>
            <div className="text-sm font-medium">{meta.label}</div>
            <div className="text-xs text-muted-foreground">
              {typeof current?.temperature === 'number'
                ? `${Math.round(current.temperature)}°C`
                : '—'}
            </div>
          </div>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-sm">
          <div className="rounded-lg border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Droplets className="size-4" />
              Humidity
            </div>
            <div className="mt-1 font-medium">
              {typeof humidity === 'number' ? `${humidity}%` : '—'}
            </div>
          </div>
          <div className="rounded-lg border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <CloudRain className="size-4" />
              Rain risk
            </div>
            <div className="mt-1 font-medium">
              {typeof rain === 'number' ? `${rain}%` : '—'}
            </div>
          </div>
          <div className="rounded-lg border bg-background/40 p-3">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Wind className="size-4" />
              Wind
            </div>
            <div className="mt-1 font-medium">
              {typeof current?.windspeed === 'number'
                ? `${Math.round(current.windspeed)} km/h`
                : '—'}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

