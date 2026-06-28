import { v4 as uuidv4 } from 'uuid'
import type { ContactSubmission, FartLog } from '../types'
import { isWithinRadius, roundCoordinate } from './geo'
import { MATCH_RADIUS_METERS } from './constants'
import { PREFECTURES } from './prefectures'
import { canManageLog, removeMyLogId, trackMyLogId } from './myLogs'
import { getSupabaseClient } from './supabase'

const LOGS_KEY = 'hello-p-log:logs'
const CONTACTS_KEY = 'hello-p-log:contacts'

function getSupabase() {
  return getSupabaseClient()
}

function readLocalLogs(): FartLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY)
    const logs = raw ? (JSON.parse(raw) as FartLog[]) : []
    return logs.map(normalizeLog)
  } catch {
    return []
  }
}

function normalizeLog(log: FartLog): FartLog {
  return {
    ...log,
    smellTypeOther: log.smellTypeOther ?? null,
    smellIntensityOther: log.smellIntensityOther ?? null,
    soundOther: log.soundOther ?? null,
    bustedOther: log.bustedOther ?? null,
    tacticsOther: log.tacticsOther ?? null,
    locationSource: log.locationSource ?? null,
    mapPrefecture: log.mapPrefecture ?? null,
    mapCity: log.mapCity ?? null,
  }
}

function writeLocalLogs(logs: FartLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

function rowToLog(row: Record<string, unknown>): FartLog {
  return normalizeLog({
    id: row.id as string,
    userId: (row.user_id as string | null) ?? null,
    source: row.source as FartLog['source'],
    latitude: row.latitude as number,
    longitude: row.longitude as number,
    createdAt: row.created_at as string,
    loggedAt: row.logged_at as string,
    nickname: row.nickname as string,
    gender: (row.gender as string | null) ?? null,
    ageDisplay: (row.age_display as string | null) ?? null,
    hideGender: Boolean(row.hide_gender),
    hideAge: Boolean(row.hide_age),
    mainComponent: row.main_component as string,
    smellType: row.smell_type as string,
    smellTypeOther: (row.smell_type_other as string | null) ?? null,
    smellIntensity: row.smell_intensity as number,
    smellIntensityOther: (row.smell_intensity_other as string | null) ?? null,
    soundText: row.sound_text as string,
    soundPreset: row.sound_preset as string,
    soundOther: (row.sound_other as string | null) ?? null,
    bustedCount: row.busted_count as number,
    bustedOther: (row.busted_other as string | null) ?? null,
    tactics: row.tactics as FartLog['tactics'],
    tacticsOther: (row.tactics_other as string | null) ?? null,
    releaseSpeedKmh: (row.release_speed_kmh as number | null) ?? null,
    releaseSpeedComparison: (row.release_speed_comparison as string | null) ?? null,
    dilutionRate: (row.dilution_rate as string | null) ?? null,
    socialImpact: (row.social_impact as string | null) ?? null,
    entityType: row.entity_type as FartLog['entityType'],
    animalSpecies: (row.animal_species as string | null) ?? null,
    observedConfirmed: Boolean(row.observed_confirmed),
    photoDataUrl: (row.photo_data_url as string | null) ?? null,
    photoTapX: (row.photo_tap_x as number | null) ?? null,
    photoTapY: (row.photo_tap_y as number | null) ?? null,
    blurConfirmed: Boolean(row.blur_confirmed),
    fartLocation: (row.fart_location as string | null) ?? null,
    fartLocationOther: (row.fart_location_other as string | null) ?? null,
    locationSource: (row.location_source as FartLog['locationSource']) ?? null,
    mapPrefecture: (row.map_prefecture as string | null) ?? null,
    mapCity: (row.map_city as string | null) ?? null,
  })
}

function logToRow(log: FartLog): Record<string, unknown> {
  return {
    id: log.id,
    user_id: log.userId,
    source: log.source,
    latitude: log.latitude,
    longitude: log.longitude,
    created_at: log.createdAt,
    logged_at: log.loggedAt,
    nickname: log.nickname,
    gender: log.gender,
    age_display: log.ageDisplay,
    hide_gender: log.hideGender,
    hide_age: log.hideAge,
    main_component: log.mainComponent,
    smell_type: log.smellType,
    smell_type_other: log.smellTypeOther,
    smell_intensity: log.smellIntensity,
    smell_intensity_other: log.smellIntensityOther,
    sound_text: log.soundText,
    sound_preset: log.soundPreset,
    sound_other: log.soundOther,
    busted_count: log.bustedCount,
    busted_other: log.bustedOther,
    tactics: log.tactics,
    tactics_other: log.tacticsOther,
    release_speed_kmh: log.releaseSpeedKmh,
    release_speed_comparison: log.releaseSpeedComparison,
    dilution_rate: log.dilutionRate,
    social_impact: log.socialImpact,
    entity_type: log.entityType,
    animal_species: log.animalSpecies,
    observed_confirmed: log.observedConfirmed,
    photo_data_url: log.photoDataUrl,
    photo_tap_x: log.photoTapX,
    photo_tap_y: log.photoTapY,
    blur_confirmed: log.blurConfirmed,
    fart_location: log.fartLocation,
    fart_location_other: log.fartLocationOther,
    location_source: log.locationSource,
    map_prefecture: log.mapPrefecture,
    map_city: log.mapCity,
  }
}

export function isSupabaseEnabled(): boolean {
  return getSupabase() !== null
}

export async function fetchAllLogs(): Promise<FartLog[]> {
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase
      .from('fart_logs')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    return (data ?? []).map(rowToLog)
  }
  return readLocalLogs()
}

export async function fetchLogById(id: string): Promise<FartLog | null> {
  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase.from('fart_logs').select('*').eq('id', id).maybeSingle()
    if (error) throw error
    return data ? rowToLog(data) : null
  }
  return readLocalLogs().find((log) => log.id === id) ?? null
}

export async function fetchMyLogs(userId: string | null): Promise<FartLog[]> {
  if (!userId) return []

  const supabase = getSupabase()
  if (supabase) {
    const { data, error } = await supabase
      .from('fart_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'user')
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('fetchMyLogs by user_id:', error)
      return []
    }
    return (data ?? []).map(rowToLog)
  }

  return readLocalLogs()
    .filter((log) => log.source === 'user' && log.userId === userId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
}

export async function saveLog(log: FartLog): Promise<FartLog> {
  const normalized: FartLog = {
    ...log,
    latitude: roundCoordinate(log.latitude),
    longitude: roundCoordinate(log.longitude),
  }

  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('fart_logs').insert(logToRow(normalized))
    if (error) throw error
  } else {
    const logs = readLocalLogs()
    logs.unshift(normalized)
    writeLocalLogs(logs)
  }

  if (normalized.source === 'user' && normalized.userId) {
    trackMyLogId(normalized.id)
  }
  return normalized
}

export async function updateLog(log: FartLog, userId: string | null): Promise<FartLog> {
  if (!canManageLog(log, userId)) {
    throw new Error('このログを編集する権限がありません')
  }

  const normalized: FartLog = {
    ...log,
    latitude: roundCoordinate(log.latitude),
    longitude: roundCoordinate(log.longitude),
  }

  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('fart_logs').update(logToRow(normalized)).eq('id', log.id)
    if (error) throw error
    return normalized
  }

  const logs = readLocalLogs()
  const index = logs.findIndex((item) => item.id === log.id)
  if (index === -1) throw new Error('ログが見つかりません')
  logs[index] = normalized
  writeLocalLogs(logs)
  return normalized
}

export async function deleteLog(id: string): Promise<void> {
  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('fart_logs').delete().eq('id', id)
    if (error) throw error
    return
  }
  writeLocalLogs(readLocalLogs().filter((l) => l.id !== id))
}

export async function deleteOwnLog(id: string, userId: string | null): Promise<void> {
  const log = await fetchLogById(id)
  if (!log || !canManageLog(log, userId)) {
    throw new Error('このログを削除する権限がありません')
  }
  await deleteLog(id)
  removeMyLogId(id)
}

export async function findNearbyUserLogs(lat: number, lng: number): Promise<FartLog[]> {
  const all = await fetchAllLogs()
  return all.filter(
    (log) =>
      log.source === 'user' &&
      isWithinRadius(lat, lng, log.latitude, log.longitude, MATCH_RADIUS_METERS),
  )
}

const TARGET_AI_MAP_LOGS = 100

/** 全国マップ用: AIログが TARGET 件未満なら都道府県にばらして追加 */
export async function seedAiLogsIfEmpty(): Promise<void> {
  const existing = await fetchAllLogs()
  const aiCount = existing.filter((l) => l.source === 'ai').length
  if (aiCount >= TARGET_AI_MAP_LOGS) return

  const needed = TARGET_AI_MAP_LOGS - aiCount
  const { generateAiLog } = await import('./aiLogGenerator')

  for (let i = 0; i < needed; i++) {
    const pref = PREFECTURES[i % PREFECTURES.length]!
    const lat = roundCoordinate(pref.lat + (Math.random() - 0.5) * 0.12)
    const lng = roundCoordinate(pref.lng + (Math.random() - 0.5) * 0.12)
    await saveLog(generateAiLog(lat, lng))
  }
}

export async function submitContact(
  submission: Omit<ContactSubmission, 'id' | 'createdAt'>,
): Promise<void> {
  const record: ContactSubmission = {
    ...submission,
    id: uuidv4(),
    createdAt: new Date().toISOString(),
  }

  const supabase = getSupabase()
  if (supabase) {
    const { error } = await supabase.from('contact_submissions').insert({
      id: record.id,
      type: record.type,
      log_id: record.logId,
      message: record.message,
      reply_email: record.replyEmail,
      created_at: record.createdAt,
    })
    if (error) throw error
    return
  }

  const raw = localStorage.getItem(CONTACTS_KEY)
  const list: ContactSubmission[] = raw ? JSON.parse(raw) : []
  list.unshift(record)
  localStorage.setItem(CONTACTS_KEY, JSON.stringify(list))
}

export function getLocalContacts(): ContactSubmission[] {
  const raw = localStorage.getItem(CONTACTS_KEY)
  return raw ? (JSON.parse(raw) as ContactSubmission[]) : []
}

export function getAdminPassword(): string {
  return import.meta.env.VITE_ADMIN_PASSWORD ?? 'hello-p-log-admin'
}
