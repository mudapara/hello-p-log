import type { FartLog, PrefectureRankingEntry, UserProfile, UserRankingEntry } from '../types'
import { getSoundOption } from './constants'
import { fetchAllLogs } from './logStore'
import { getMethaneLevel, parseMethaneLevel } from './methaneConcentration'
import {
  calculateLogPoints,
  DAILY_LOGIN_POINTS,
  NEW_PREFECTURE_POINTS,
} from './methanePoints'
import { getPrefectureFromCoords } from './prefectures'
import { getOrCreateLocalUserId, isLocalUserId } from './localUserId'
import { getSupabaseClient } from './supabase'
import {
  computeUnlockedMistStyles,
  computeUnlockedTitles,
  type MistStyleId,
} from './titles'

const PROFILE_KEY_PREFIX = 'hello-p-log:profile:'

function defaultProfile(userId: string): UserProfile {
  return {
    userId,
    displayName: null,
    methanePoints: 0,
    totalLogs: 0,
    photoLogs: 0,
    silentLogs: 0,
    maxMethaneLevel: 0,
    uniquePrefectures: [],
    unlockedTitles: [],
    activeTitle: null,
    activeMistStyle: 'default',
    lastLoginDate: null,
  }
}

function rowToProfile(row: Record<string, unknown>): UserProfile {
  return {
    userId: row.user_id as string,
    displayName: (row.display_name as string | null) ?? null,
    methanePoints: (row.methane_points as number) ?? 0,
    totalLogs: (row.total_logs as number) ?? 0,
    photoLogs: (row.photo_logs as number) ?? 0,
    silentLogs: (row.silent_logs as number) ?? 0,
    maxMethaneLevel: (row.max_methane_level as number) ?? 0,
    uniquePrefectures: (row.unique_prefectures as string[]) ?? [],
    unlockedTitles: (row.unlocked_titles as string[]) ?? [],
    activeTitle: (row.active_title as string | null) ?? null,
    activeMistStyle: ((row.active_mist_style as MistStyleId) ?? 'default'),
    lastLoginDate: (row.last_login_date as string | null) ?? null,
  }
}

function profileToRow(profile: UserProfile): Record<string, unknown> {
  return {
    user_id: profile.userId,
    display_name: profile.displayName,
    methane_points: profile.methanePoints,
    total_logs: profile.totalLogs,
    photo_logs: profile.photoLogs,
    silent_logs: profile.silentLogs,
    max_methane_level: profile.maxMethaneLevel,
    unique_prefectures: profile.uniquePrefectures,
    unlocked_titles: profile.unlockedTitles,
    active_title: profile.activeTitle,
    active_mist_style: profile.activeMistStyle,
    last_login_date: profile.lastLoginDate,
    updated_at: new Date().toISOString(),
  }
}

function readLocalProfile(userId: string): UserProfile {
  try {
    const raw = localStorage.getItem(`${PROFILE_KEY_PREFIX}${userId}`)
    return raw ? { ...defaultProfile(userId), ...(JSON.parse(raw) as UserProfile) } : defaultProfile(userId)
  } catch {
    return defaultProfile(userId)
  }
}

function writeLocalProfile(profile: UserProfile): void {
  localStorage.setItem(`${PROFILE_KEY_PREFIX}${profile.userId}`, JSON.stringify(profile))
}

async function saveProfile(profile: UserProfile): Promise<UserProfile> {
  if (isLocalUserId(profile.userId)) {
    writeLocalProfile(profile)
    return profile
  }
  const supabase = getSupabaseClient()
  if (supabase) {
    const { error } = await supabase
      .from('user_profiles')
      .upsert(profileToRow(profile), { onConflict: 'user_id' })
    if (error) throw error
    return profile
  }
  writeLocalProfile(profile)
  return profile
}

function isSilentLog(log: FartLog): boolean {
  const category = getSoundOption(log.soundPreset)?.category
  return category === 'すかし' || log.soundPreset === 'mask_silent'
}

function applyLogToProfile(profile: UserProfile, log: FartLog, prefecture: string): UserProfile {
  const level = parseMethaneLevel(getMethaneLevel(log))
  const prefSet = new Set(profile.uniquePrefectures)
  const isNewPref = !prefSet.has(prefecture)
  prefSet.add(prefecture)

  const next: UserProfile = {
    ...profile,
    displayName: profile.displayName ?? log.nickname,
    totalLogs: profile.totalLogs + 1,
    photoLogs: profile.photoLogs + (log.photoDataUrl ? 1 : 0),
    silentLogs: profile.silentLogs + (isSilentLog(log) ? 1 : 0),
    maxMethaneLevel: Math.max(profile.maxMethaneLevel, level),
    uniquePrefectures: [...prefSet],
  }

  const award = calculateLogPoints(log)
  let points = award.total
  if (isNewPref) points += NEW_PREFECTURE_POINTS

  next.methanePoints = profile.methanePoints + points
  next.unlockedTitles = computeUnlockedTitles(next)
  if (!next.activeTitle && next.unlockedTitles.length > 0) {
    next.activeTitle = next.unlockedTitles[0]!
  }
  const allowedMist = computeUnlockedMistStyles(next.unlockedTitles)
  if (!allowedMist.includes(next.activeMistStyle)) {
    next.activeMistStyle = 'default'
  }
  return next
}

export async function getUserProfile(userId: string): Promise<UserProfile> {
  if (isLocalUserId(userId)) {
    return readLocalProfile(userId)
  }
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()
    if (error) {
      console.warn('getUserProfile:', error)
      return defaultProfile(userId)
    }
    return data ? rowToProfile(data) : defaultProfile(userId)
  }
  return readLocalProfile(userId)
}

export async function getProfilesByUserIds(userIds: string[]): Promise<Map<string, UserProfile>> {
  const unique = [...new Set(userIds.filter(Boolean))]
  const map = new Map<string, UserProfile>()
  if (unique.length === 0) return map

  for (const id of unique) {
    if (isLocalUserId(id)) {
      map.set(id, readLocalProfile(id))
    }
  }

  const serverIds = unique.filter((id) => !isLocalUserId(id))
  if (serverIds.length === 0) return map

  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase.from('user_profiles').select('*').in('user_id', serverIds)
    if (error) throw error
    for (const row of data ?? []) {
      const profile = rowToProfile(row)
      map.set(profile.userId, profile)
    }
    for (const id of serverIds) {
      if (!map.has(id)) map.set(id, defaultProfile(id))
    }
    return map
  }

  for (const id of serverIds) {
    map.set(id, readLocalProfile(id))
  }
  return map
}

/** マップ用。キーは userId または匿名ログの log.id */
export async function buildUserMistStyleMap(
  logs: FartLog[],
  authUserId: string | null,
): Promise<Map<string, string>> {
  const map = new Map<string, string>()
  const userIds = logs.filter((l) => l.source === 'user' && l.userId).map((l) => l.userId!)
  const profiles = await getProfilesByUserIds(userIds)
  for (const [userId, profile] of profiles) {
    if (profile.activeMistStyle !== 'default') {
      map.set(userId, profile.activeMistStyle)
    }
  }

  if (!authUserId) return map

  const ownProfile = await getUserProfile(authUserId)
  if (ownProfile.activeMistStyle === 'default') return map

  const style = ownProfile.activeMistStyle
  map.set(authUserId, style)
  return map
}

export async function awardMethanePointsForLog(userId: string, log: FartLog): Promise<UserProfile> {
  if (isLocalUserId(userId)) {
    return getUserProfile(userId)
  }
  const profile = await getUserProfile(userId)
  const prefecture = getPrefectureFromCoords(log.latitude, log.longitude)
  const updated = applyLogToProfile(profile, log, prefecture)
  return saveProfile(updated)
}

export async function recordDailyLogin(userId: string): Promise<UserProfile> {
  if (isLocalUserId(userId)) {
    return getUserProfile(userId)
  }
  const profile = await getUserProfile(userId)
  const today = new Date().toISOString().slice(0, 10)
  if (profile.lastLoginDate === today) return profile

  const updated: UserProfile = {
    ...profile,
    lastLoginDate: today,
    methanePoints: profile.methanePoints + DAILY_LOGIN_POINTS,
  }
  updated.unlockedTitles = computeUnlockedTitles(updated)
  return saveProfile(updated)
}

export async function updateUserProfileSettings(
  userId: string,
  settings: { activeTitle?: string | null; activeMistStyle?: MistStyleId },
): Promise<UserProfile> {
  const profile = await getUserProfile(userId)
  const updated = { ...profile }

  if (settings.activeTitle !== undefined) {
    if (settings.activeTitle && !profile.unlockedTitles.includes(settings.activeTitle)) {
      throw new Error('まだ獲得していない称号です')
    }
    updated.activeTitle = settings.activeTitle
  }

  if (settings.activeMistStyle !== undefined) {
    const allowed = computeUnlockedMistStyles(profile.unlockedTitles)
    if (!allowed.includes(settings.activeMistStyle)) {
      throw new Error('まだ解放されていないモヤです')
    }
    updated.activeMistStyle = settings.activeMistStyle
  }

  return saveProfile(updated)
}

/** 未ログイン時に溜めたローカルプロフィールを、初回ログイン時にサーバーへ移す */
export async function mergeLocalProfileIntoAuthUser(authUserId: string): Promise<void> {
  const localId = getOrCreateLocalUserId()
  const local = readLocalProfile(localId)
  if (local.totalLogs === 0) return

  const server = await getUserProfile(authUserId)
  if (server.totalLogs > 0) return

  await saveProfile({ ...local, userId: authUserId })
  writeLocalProfile(defaultProfile(localId))
}

export async function fetchPrefectureRanking(limit = 10): Promise<PrefectureRankingEntry[]> {
  const logs = (await fetchAllLogs()).filter((l) => l.source === 'user')
  const counts = new Map<string, number>()
  for (const log of logs) {
    const pref = getPrefectureFromCoords(log.latitude, log.longitude)
    counts.set(pref, (counts.get(pref) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([prefecture, count]) => ({ prefecture, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit)
}

export async function fetchUserRanking(limit = 10): Promise<UserRankingEntry[]> {
  const supabase = getSupabaseClient()
  if (supabase) {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('user_id, display_name, methane_points, total_logs, active_title, active_mist_style')
      .gt('total_logs', 0)
      .order('methane_points', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []).map((row) => ({
      userId: row.user_id as string,
      displayName: (row.display_name as string) || '名無しの屁師',
      methanePoints: row.methane_points as number,
      totalLogs: row.total_logs as number,
      activeTitle: (row.active_title as string | null) ?? null,
      activeMistStyle: (row.active_mist_style as string) ?? 'default',
    }))
  }

  const logs = (await fetchAllLogs()).filter((l) => l.source === 'user' && l.userId)
  const byUser = new Map<string, FartLog[]>()
  for (const log of logs) {
    if (!log.userId) continue
    const list = byUser.get(log.userId) ?? []
    list.push(log)
    byUser.set(log.userId, list)
  }

  const entries: UserRankingEntry[] = []
  for (const [userId, userLogs] of byUser) {
    if (isLocalUserId(userId)) continue
    const profile = readLocalProfile(userId)
    entries.push({
      userId,
      displayName: profile.displayName ?? userLogs[0]?.nickname ?? '名無しの屁師',
      methanePoints: profile.methanePoints,
      totalLogs: profile.totalLogs || userLogs.length,
      activeTitle: profile.activeTitle,
      activeMistStyle: profile.activeMistStyle,
    })
  }
  return entries.sort((a, b) => b.methanePoints - a.methanePoints).slice(0, limit)
}

export function getMistStyleClass(style: MistStyleId | string | undefined): string {
  switch (style) {
    case 'royal':
      return 'mist-premium-royal'
    case 'toxic':
      return 'mist-premium-toxic'
    case 'rainbow':
      return 'mist-premium-rainbow'
    case 'ghost':
      return 'mist-premium-ghost'
    case 'ember':
      return 'mist-premium-ember'
    case 'void':
      return 'mist-premium-void'
    case 'storm':
      return 'mist-premium-storm'
    case 'neon':
      return 'mist-premium-neon'
    case 'bud':
      return 'mist-premium-bud'
    case 'whisper':
      return 'mist-premium-whisper'
    case 'ninja':
      return 'mist-premium-ninja'
    case 'travel':
      return 'mist-premium-travel'
    case 'sovereign':
      return 'mist-premium-sovereign'
    case 'poetic':
      return 'mist-premium-poetic'
    case 'veteran':
      return 'mist-premium-veteran'
    case 'fortune':
      return 'mist-premium-fortune'
    case 'titan':
      return 'mist-premium-titan'
    case 'divine':
      return 'mist-premium-divine'
    default:
      return ''
  }
}

export function getMapMistClass(style: MistStyleId | string | undefined): string {
  switch (style) {
    case 'royal':
      return 'map-marker-royal'
    case 'toxic':
      return 'map-marker-toxic'
    case 'rainbow':
      return 'map-marker-rainbow'
    case 'ghost':
      return 'map-marker-ghost'
    case 'ember':
      return 'map-marker-ember'
    case 'void':
      return 'map-marker-void'
    case 'storm':
      return 'map-marker-storm'
    case 'neon':
      return 'map-marker-neon'
    case 'bud':
      return 'map-marker-bud'
    case 'whisper':
      return 'map-marker-whisper'
    case 'ninja':
      return 'map-marker-ninja'
    case 'travel':
      return 'map-marker-travel'
    case 'sovereign':
      return 'map-marker-sovereign'
    case 'poetic':
      return 'map-marker-poetic'
    case 'veteran':
      return 'map-marker-veteran'
    case 'fortune':
      return 'map-marker-fortune'
    case 'titan':
      return 'map-marker-titan'
    case 'divine':
      return 'map-marker-divine'
    default:
      return ''
  }
}
