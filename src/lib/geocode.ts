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

type SearchHit = {
  lat: string
  lon: string
  display_name: string
  type?: string
  class?: string
  importance?: number
}

function normalizeJapaneseCity(city: string) {
  const trimmed = city.trim().replace(/\s/g, '')
  const suffix = trimmed.match(/(市|区|町|村)$/)?.[1] ?? '市'
  const base = trimmed.replace(/(市|区|町|村)$/, '') || trimmed
  const label = `${base}${suffix}`
  return { base, label, suffix }
}

function buildSearchQueries(label: string, base: string, suffix: string, prefecture: PrefectureName): string[] {
  const queries: string[] = []
  if (suffix === '市') {
    queries.push(`${base}市役所, ${prefecture}, 日本`)
    queries.push(`${base}市駅, ${prefecture}, 日本`)
  } else if (suffix === '区') {
    queries.push(`${label}, ${prefecture}, 日本`)
    queries.push(`${label}駅, ${prefecture}, 日本`)
  } else {
    queries.push(`${label}役場, ${prefecture}, 日本`)
    queries.push(`${label}駅, ${prefecture}, 日本`)
  }
  queries.push(`${label}, ${prefecture}, 日本`)
  return queries
}

async function nominatimSearch(params: Record<string, string>, limit = 5): Promise<SearchHit[]> {
  const url = new URL('https://nominatim.openstreetmap.org/search')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }
  url.searchParams.set('format', 'json')
  url.searchParams.set('accept-language', 'ja')
  url.searchParams.set('limit', String(limit))

  const res = await fetch(url, {
    headers: nominatimHeaders(),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return []
  return (await res.json()) as SearchHit[]
}

function scoreSearchHit(
  hit: SearchHit,
  cityBase: string,
  cityLabel: string,
  prefecture: PrefectureName,
): number {
  const name = hit.display_name
  const prefShort = prefecture.replace(/[都府県道]$/, '')
  let score = 0

  if (name.includes(cityBase)) score += 14
  if (name.includes(cityLabel)) score += 10
  if (name.includes(prefecture) || name.includes(prefShort)) score += 8
  if (name.includes('市役所') || name.includes('役所') || name.includes('役場')) score += 12
  if (name.includes('駅')) score += 9
  if (hit.type === 'administrative' || hit.class === 'boundary') score += 5
  if (hit.importance) score += hit.importance * 3

  if (!name.includes(cityBase)) score -= 20
  if (name.includes('大阪駅') && cityBase !== '大阪') score -= 30
  if (name.includes('大阪市役所') && cityBase !== '大阪') score -= 40
  if (name.includes('中之島') && cityBase !== '大阪') score -= 25
  if (cityBase !== prefShort && name.includes(`${prefShort}市`) && !name.includes(cityBase)) {
    score -= 15
  }

  return score
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
  const { base, label, suffix } = normalizeJapaneseCity(city)
  if (!base) return null

  const candidates: SearchHit[] = []

  try {
    const structured = await nominatimSearch({
      city: label,
      state: prefecture,
      country: 'Japan',
      countrycodes: 'jp',
    })
    candidates.push(...structured)
  } catch {
    // continue with text queries
  }

  for (const query of buildSearchQueries(label, base, suffix, prefecture)) {
    try {
      const results = await nominatimSearch({ q: query, countrycodes: 'jp' })
      candidates.push(...results)
    } catch {
      // try next query
    }
  }

  if (candidates.length === 0) return null

  const scored = candidates
    .map((hit) => ({ hit, score: scoreSearchHit(hit, base, label, prefecture) }))
    .sort((a, b) => b.score - a.score)

  const best = scored[0]
  if (!best || best.score < 8) return null

  return {
    lat: Number.parseFloat(best.hit.lat),
    lng: Number.parseFloat(best.hit.lon),
  }
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
