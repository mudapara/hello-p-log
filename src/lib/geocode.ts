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
  const trimmedCity = city.trim().replace(/\s/g, '')
  if (!trimmedCity) return null

  const cityLabel = /[市区町村]$/.test(trimmedCity) ? trimmedCity : `${trimmedCity}市`
  const cityBase = cityLabel.replace(/[市区町村]$/, '')

  const queries = [
    `${cityLabel}市役所, ${prefecture}, 日本`,
    `${cityLabel}駅, ${prefecture}, 日本`,
    `${cityLabel}, ${prefecture}, 日本`,
    `${cityBase}, ${prefecture}, 日本`,
  ]

  type SearchHit = {
    lat: string
    lon: string
    display_name: string
    type?: string
    class?: string
    importance?: number
  }

  const candidates: SearchHit[] = []

  for (const query of queries) {
    try {
      const url = new URL('https://nominatim.openstreetmap.org/search')
      url.searchParams.set('q', query)
      url.searchParams.set('format', 'json')
      url.searchParams.set('accept-language', 'ja')
      url.searchParams.set('countrycodes', 'jp')
      url.searchParams.set('limit', '5')

      const res = await fetch(url, {
        headers: nominatimHeaders(),
        signal: AbortSignal.timeout(8000),
      })
      if (!res.ok) continue

      const results = (await res.json()) as SearchHit[]
      candidates.push(...results)
    } catch {
      // try next query
    }
  }

  if (candidates.length > 0) {
    const prefShort = prefecture.replace(/[都府県道]$/, '')
    const scored = candidates
      .map((hit) => {
        const name = hit.display_name
        let score = 0
        if (name.includes(cityBase)) score += 12
        if (name.includes(cityLabel)) score += 8
        if (name.includes(prefecture) || name.includes(prefShort)) score += 6
        if (name.includes('市役所') || name.includes('役所') || name.includes('市政')) score += 10
        if (name.includes('駅')) score += 8
        if (hit.type === 'administrative' || hit.class === 'boundary') score += 4
        if (hit.importance) score += hit.importance * 3
        if (cityBase !== '大阪' && cityBase !== prefShort && name.includes('大阪駅')) score -= 25
        if (cityBase !== prefShort && name.includes(`${prefShort}駅`) && !name.includes(cityBase)) {
          score -= 12
        }
        return { hit, score }
      })
      .sort((a, b) => b.score - a.score)

    const best = scored[0]
    if (best && best.score > 0) {
      return {
        lat: Number.parseFloat(best.hit.lat),
        lng: Number.parseFloat(best.hit.lon),
      }
    }
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
