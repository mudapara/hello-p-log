import type { FartLog } from '../types'
import { getMethaneLevel, parseMethaneLevel } from './methaneConcentration'

export interface PointAward {
  total: number
  breakdown: string[]
}

export function calculateLogPoints(log: FartLog): PointAward {
  const breakdown: string[] = []
  let total = 10
  breakdown.push('ログ投稿 +10')

  if (log.photoDataUrl) {
    total += 5
    breakdown.push('写真付き +5')
  }

  const level = parseMethaneLevel(getMethaneLevel(log))
  if (level >= 80) {
    total += 10
    breakdown.push('高メタン（80+） +10')
  } else if (level >= 50) {
    total += 5
    breakdown.push('中メタン（50+） +5')
  }

  if (log.soundPreset === 'mask_silent' || log.soundPreset.startsWith('mask_')) {
    total += 3
    breakdown.push('静かな策 +3')
  }

  return { total, breakdown }
}

export const DAILY_LOGIN_POINTS = 3
export const NEW_PREFECTURE_POINTS = 20
