import { v4 as uuidv4 } from 'uuid'
import type { ContactSubmission, FartLog } from '../types'
import { isWithinRadius, roundCoordinate } from './geo'
import { MATCH_RADIUS_METERS } from './constants'
import { canManageLog, getMyLogIds, removeMyLogId, trackMyLogId } from './myLogs'
import { getSupabaseClient } from './supabase'

const LOGS_KEY = 'hello-p-log:logs'
const CONTACTS_KEY = 'hello-p-log:contacts'

function getSupabase() {
  return getSupabaseClient()
}

function readLocalLogs(): FartLog[] {
  try {
    const raw = localStorage.getItem(LOGS_KEY)
    return raw ? (JSON.parse(raw) as FartLog[]) : []
  } catch {
    return []
  }
}

function writeLocalLogs(logs: FartLog[]): void {
  localStorage.setItem(LOGS_KEY, JSON.stringify(logs))
}

function rowToLog(row: Record<string, unknown>): FartLog {
  return {
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
    smellIntensity: row.smell_intensity as number,
    soundText: row.sound_text as string,
    soundPreset: row.sound_preset as string,
    bustedCount: row.busted_count as number,
    tactics: row.tactics as FartLog['tactics'],
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
  }
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
    smell_intensity: log.smellIntensity,
    sound_text: log.soundText,
    sound_preset: log.soundPreset,
    busted_count: log.bustedCount,
    tactics: log.tactics,
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
  const supabase = getSupabase()
  const byId = new Map<string, FartLog>()

  if (supabase && userId) {
    const { data, error } = await supabase
      .from('fart_logs')
      .select('*')
      .eq('user_id', userId)
      .eq('source', 'user')
      .order('created_at', { ascending: false })
    if (error) {
      console.warn('fetchMyLogs by user_id:', error)
    } else {
      for (const row of data ?? []) {
        byId.set(row.id as string, rowToLog(row))
      }
    }
  }

  const localIds = getMyLogIds()
  if (localIds.length > 0) {
    try {
      const all = supabase ? await fetchAllLogs() : readLocalLogs()
      for (const log of all) {
        if (log.source === 'user' && localIds.includes(log.id)) {
          byId.set(log.id, log)
        }
      }
    } catch (e) {
      console.warn('fetchMyLogs local merge:', e)
    }
  }

  return [...byId.values()].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
  )
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

  if (normalized.source === 'user') {
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

export async function seedAiLogsIfEmpty(): Promise<void> {
  const existing = await fetchAllLogs()
  if (existing.length > 0) return

  const seeds = [
    { lat: 35.6812, lng: 139.7671 },
    { lat: 34.6937, lng: 135.5023 },
    { lat: 43.0621, lng: 141.3544 },
    { lat: 33.5904, lng: 130.4017 },
    { lat: 35.1709, lng: 136.8815 },
  ]

  const { generateAiLog } = await import('./aiLogGenerator')
  for (const { lat, lng } of seeds) {
    for (let i = 0; i < 8; i++) {
      await saveLog(generateAiLog(lat, lng))
    }
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
