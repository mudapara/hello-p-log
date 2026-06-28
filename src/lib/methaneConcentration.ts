import type { FartLog, TacticId } from '../types'
import { getSoundOption } from './constants'

/** 匂いの強さ（1〜6）ごとのベースレベル（1〜99.9） */
const SMELL_BASE_LEVEL = [5, 12, 24, 40, 60, 78]

const SOUND_CATEGORY_FACTOR: Record<string, number> = {
  すかし: 0.72,
  小: 0.88,
  中: 1.0,
  大: 1.22,
}

const SMELLY_FOOD_KEYWORDS = [
  'カレー', '納豆', 'キムチ', '焼き芋', 'ビール', 'ラーメン', 'すき焼き', 'たこ焼き',
  'ニンニク', 'オニオン', 'カツオ', 'おでん', 'コンビニ弁当',
]

const MILD_FOOD_KEYWORDS = ['サラダ', 'お茶', '水', 'うどん', '豆腐', 'りんご', 'ヨーグルト']

const MAX_METHANE_LEVEL = 99.9
const MIN_METHANE_LEVEL = 1

function foodFactor(mainComponent: string): number {
  if (SMELLY_FOOD_KEYWORDS.some((k) => mainComponent.includes(k))) return 1.15
  if (MILD_FOOD_KEYWORDS.some((k) => mainComponent.includes(k))) return 0.82
  return 1.0
}

function tacticFactor(tactics: TacticId[]): number {
  let factor = 1.0
  if (tactics.includes('vortex')) factor *= 0.75
  if (tactics.includes('rear_guard')) factor *= 1.08
  return factor
}

/** 音カテゴリから放出速度（km/h）を推定 */
export function estimateSpeedFromSound(soundPreset: string): number {
  const category = getSoundOption(soundPreset)?.category
  switch (category) {
    case 'すかし':
      return 3
    case '小':
      return 5
    case '中':
      return 9
    case '大':
      return 13
    default:
      return 6
  }
}

function speedFactor(kmh: number): number {
  if (kmh <= 4) return 1.1
  if (kmh <= 7) return 1.0
  if (kmh <= 10) return 0.9
  return 0.82
}

function bustedFactor(count: number): number {
  if (count < 0) return 1
  return 1 + Math.min(count, 4) * 0.035
}

function formatLevel(level: number): string {
  const clamped = Math.min(MAX_METHANE_LEVEL, Math.max(MIN_METHANE_LEVEL, level))
  const rounded = Math.round(clamped * 10) / 10
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1)
}

function isLegacyStoredValue(value: string): boolean {
  if (value.includes('%')) return true
  const num = Number.parseFloat(value)
  return !Number.isNaN(num) && num < 2.5
}

/** 主成分・匂い・音・バレ度・戦術・速度からメタンレベル（1〜99.9）を推定 */
export function estimateMethaneLevel(
  log: Pick<
    FartLog,
    'smellIntensity' | 'soundPreset' | 'bustedCount' | 'tactics' | 'releaseSpeedKmh' | 'mainComponent'
  >,
): string {
  if (log.soundPreset === 'large_nuclear') return '99.9'

  const smellIdx = log.smellIntensity === 0
    ? 2
    : Math.max(1, Math.min(6, log.smellIntensity)) - 1
  let level = SMELL_BASE_LEVEL[smellIdx]!

  const soundCategory = getSoundOption(log.soundPreset)?.category ?? '中'
  level *= SOUND_CATEGORY_FACTOR[soundCategory] ?? 1
  level *= foodFactor(log.mainComponent)
  level *= tacticFactor(log.tactics)

  const kmh = log.releaseSpeedKmh ?? estimateSpeedFromSound(log.soundPreset)
  level *= speedFactor(kmh)
  level *= bustedFactor(log.bustedCount)

  return formatLevel(level)
}

/** @deprecated estimateMethaneLevel を使用 */
export const estimateMethaneConcentration = estimateMethaneLevel

/** 保存値があればそれを、なければ推定（旧形式は再推定） */
export function getMethaneLevel(log: FartLog): string {
  if (log.dilutionRate && !isLegacyStoredValue(log.dilutionRate)) return log.dilutionRate
  return estimateMethaneLevel(log)
}

/** @deprecated getMethaneLevel を使用 */
export const getMethaneConcentration = getMethaneLevel

export function parseMethaneLevel(value: string): number {
  const num = Number.parseFloat(value.replace(/[^\d.]/g, ''))
  return Number.isNaN(num) ? 0 : num
}
