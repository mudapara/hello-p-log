import { v4 as uuidv4 } from 'uuid'
import type { EntityType, FartLog, PhotoOverlayLog, TacticId } from '../types'
import {
  AI_AGES,
  AI_FOOD_SAMPLES,
  AI_GENDERS,
  AI_NAMES_FEMALE,
  AI_NAMES_MALE,
  AI_NAMES_NEUTRAL,
  ANIMALS,
  SMELL_STRENGTH_OPTIONS,
  SMELL_TYPES,
  SOCIAL_IMPACTS,
  SOCIAL_IMPACTS_INDOOR,
  SOCIAL_IMPACTS_OUTDOOR,
  getComparisonForSpeed,
  SOUND_OPTIONS,
  TACTICS,
} from './constants'
import { estimateMethaneLevel } from './methaneConcentration'
import { positionAtButtHeight } from './photoPosition'
import { roundCoordinate } from './geo'

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]!
}

function pickMany<T>(arr: readonly T[], count: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, count)
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomLoggedAt(): string {
  const now = Date.now()
  const hoursAgo = randomInt(1, 72)
  return new Date(now - hoursAgo * 3600000).toISOString()
}

export type AiLogScene = 'outdoor' | 'indoor' | 'any'

export interface GenerateAiLogOptions {
  /** 写真鑑識などシーンに合わせた社会的影響度を選ぶ */
  scene?: AiLogScene
}

function pickNameForGender(gender: (typeof AI_GENDERS)[number]): string {
  if (gender === '男') return pick(AI_NAMES_MALE)
  if (gender === '女') return pick(AI_NAMES_FEMALE)
  return pick(AI_NAMES_NEUTRAL)
}

function pickSocialImpact(scene: AiLogScene): string {
  if (scene === 'outdoor') return pick(SOCIAL_IMPACTS_OUTDOOR)
  if (scene === 'indoor') return pick(SOCIAL_IMPACTS_INDOOR)
  return pick(SOCIAL_IMPACTS)
}

export function generateAiLog(
  lat: number,
  lng: number,
  options: GenerateAiLogOptions = {},
): FartLog {
  const scene = options.scene ?? 'any'
  const isAnimal = Math.random() < 0.2
  const entityType: EntityType = isAnimal ? 'animal' : 'human'
  const sound = pick(SOUND_OPTIONS)
  const tactics = pickMany(Object.keys(TACTICS) as TacticId[], randomInt(1, 2))
  const speed = randomInt(2, 14)
  const smellStrength = pick(SMELL_STRENGTH_OPTIONS)
  const gender = isAnimal ? null : pick([...AI_GENDERS])

  const draft: FartLog = {
    id: uuidv4(),
    source: 'ai',
    latitude: roundCoordinate(lat),
    longitude: roundCoordinate(lng),
    createdAt: new Date().toISOString(),
    loggedAt: randomLoggedAt(),
    nickname: isAnimal ? pick(ANIMALS) : pickNameForGender(gender!),
    gender,
    ageDisplay: isAnimal ? null : pick(AI_AGES),
    hideGender: false,
    hideAge: false,
    mainComponent: pick(AI_FOOD_SAMPLES),
    smellType: pick(SMELL_TYPES),
    smellIntensity: smellStrength.value,
    soundText: sound.text,
    soundPreset: sound.id,
    bustedCount: randomInt(0, 4),
    tactics,
    releaseSpeedKmh: speed,
    releaseSpeedComparison: getComparisonForSpeed(speed),
    dilutionRate: null,
    socialImpact: pickSocialImpact(scene),
    entityType,
    animalSpecies: isAnimal ? pick(ANIMALS) : null,
    observedConfirmed: false,
    photoDataUrl: null,
    photoTapX: null,
    photoTapY: null,
    blurConfirmed: false,
  }

  return {
    ...draft,
    dilutionRate: estimateMethaneLevel(draft),
  }
}

export function generateAiLogsForLocation(
  lat: number,
  lng: number,
  count?: number,
  options: GenerateAiLogOptions = {},
): FartLog[] {
  const n = count ?? randomInt(4, 9)
  return Array.from({ length: n }, () => generateAiLog(lat, lng, options))
}

export function attachOverlayPositions(
  logs: FartLog[],
  groundY = 0.88,
): PhotoOverlayLog[] {
  return logs.map((log) => {
    if (log.photoTapX != null && log.photoTapY != null) {
      return { ...log, overlayX: log.photoTapX, overlayY: log.photoTapY }
    }
    const pos = positionAtButtHeight(groundY)
    return { ...log, overlayX: pos.x, overlayY: pos.y }
  })
}

export function mergeLogsForPhoto(
  aiLogs: FartLog[],
  nearbyUserLogs: FartLog[],
  groundY = 0.88,
  maxUser = 3,
): PhotoOverlayLog[] {
  const users = nearbyUserLogs.slice(0, maxUser)
  const aiCount = Math.max(3, aiLogs.length - users.length)
  const selectedAi = aiLogs.slice(0, aiCount)
  return attachOverlayPositions([...users, ...selectedAi], groundY)
}
