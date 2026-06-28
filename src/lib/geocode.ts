import { APP_NAME, SITE_URL } from './constants'
import type { FartLog } from '../types'
import { PREFECTURES, getPrefectureFromCoords, type PrefectureName } from './prefectures'

const USER_AGENT = `${APP_NAME}/1.0 (${SITE_URL})`

function nominatimHeaders(): HeadersInit {
  return {
    Accept: 'application/json',
    'Accept-Language': 'ja',
    'User-Agent': USER_AGENT,
  }
}

export function matchPrefectureName(raw: string): PrefectureName | null {
  const normalized = raw.replace(/\s/g, '')
  for (const pref of PREFECTURES) {
    if (normalized === pref.name || normalized.includes(pref.name)) {
      return pref.name
    }
    const short = pref.name.replace(/[都府県道]$/, '')
    if (normalized === short || normalized.startsWith(`${short}市`) || normalized.startsWith(`${short}県`)) {
      return pref.name
    }
  }
  return null
}

export async function reverseGeocodePlace(
  lat: number,
  lng: number,
): Promise<{ prefecture: PrefectureName | null; city: string | null }> {
  try {
    const url = new URL('https://nominatim.openstreetmap.org/reverse')
    url.searchParams.set('lat', String(lat))
    url.searchParams.set('lon', String(lng))
    url.searchParams.set('format', 'json')
    url.searchParams.set('accept-language', 'ja')
    url.searchParams.set('zoom', '10')

    const res = await fetch(url, {
      headers: nominatimHeaders(),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error('reverse geocode failed')

    const data = (await res.json()) as { address?: Record<string, string> }
    const address = data.address
    if (!address) return { prefecture: null, city: null }

    const state = address.state ?? address.province ?? address.region ?? ''
    const prefecture = state ? matchPrefectureName(state) : null
    const city =
      address.city
      ?? address.town
      ?? address.village
      ?? address.suburb
      ?? address.city_district
      ?? address.municipality
      ?? null

    return { prefecture, city }
  } catch {
    return { prefecture: null, city: null }
  }
}

export async function geocodeManualPlace(
  prefecture: PrefectureName,
  city: string,
): Promise<{ lat: number; lng: number } | null> {
  const trimmedCity = city.trim()
  if (!trimmedCity) return null

  try {
    const url = new URL('https://nominatim.openstreetmap.org/search')
    url.searchParams.set('q', `${trimmedCity}, ${prefecture}, 日本`)
    url.searchParams.set('format', 'json')
    url.searchParams.set('accept-language', 'ja')
    url.searchParams.set('countrycodes', 'jp')
    url.searchParams.set('limit', '1')

    const res = await fetch(url, {
      headers: nominatimHeaders(),
      signal: AbortSignal.timeout(8000),
    })
    if (!res.ok) throw new Error('geocode failed')

    const results = (await res.json()) as Array<{ lat: string; lon: string }>
    const hit = results[0]
    if (hit) {
      return { lat: Number.parseFloat(hit.lat), lng: Number.parseFloat(hit.lon) }
    }
  } catch {
    // fallback below
  }

  const pref = PREFECTURES.find((p) => p.name === prefecture)
  if (!pref) return null
  return { lat: pref.lat, lng: pref.lng }
}

export function formatPlaceLabel(
  log: Pick<FartLog, 'mapPrefecture' | 'mapCity' | 'latitude' | 'longitude'>,
): string {
  if (log.mapPrefecture) {
    return log.mapCity ? `${log.mapPrefecture}（${log.mapCity}）` : log.mapPrefecture
  }
  return getPrefectureFromCoords(log.latitude, log.longitude)
}

export function getLogPrefecture(
  log: Pick<FartLog, 'mapPrefecture' | 'latitude' | 'longitude'>,
): string {
  return log.mapPrefecture ?? getPrefectureFromCoords(log.latitude, log.longitude)
}
