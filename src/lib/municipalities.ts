import type { PrefectureName } from './prefectures'
import { MUNICIPALITIES_BY_PREFECTURE, type Municipality } from './municipalitiesData'

export type { Municipality }

export function getMunicipalitiesForPrefecture(prefecture: PrefectureName): Municipality[] {
  return MUNICIPALITIES_BY_PREFECTURE[prefecture] ?? []
}

export function findMunicipality(
  prefecture: PrefectureName,
  cityName: string,
): Municipality | null {
  const trimmed = cityName.trim()
  if (!trimmed) return null
  return getMunicipalitiesForPrefecture(prefecture).find((m) => m.name === trimmed) ?? null
}

export function getMunicipalityCoords(
  prefecture: PrefectureName,
  cityName: string,
): { lat: number; lng: number } | null {
  const municipality = findMunicipality(prefecture, cityName)
  if (!municipality) return null
  return { lat: municipality.lat, lng: municipality.lng }
}
