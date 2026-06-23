import { v4 as uuidv4 } from 'uuid'
import type { EntityType, FartLog, PhotoOverlayLog, TacticId } from '../types'
import {
  AI_AGES,
  AI_FOOD_SAMPLES,
  AI_GENDERS,
  AI_NAMES,
  ANIMALS,
  DILUTION_RATES,
  SMELL_STRENGTH_OPTIONS,
  SMELL_TYPES,
  SOCIAL_IMPACTS,
  getComparisonForSpeed,
  SOUND_OPTIONS,
  TACTICS,
} from './constants'
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

export function generateAiLog(lat: number, lng: number): FartLog {
  const isAnimal = Math.random() < 0.2
  const entityType: EntityType = isAnimal ? 'animal' : 'human'
  const sound = pick(SOUND_OPTIONS)
  const tactics = pickMany(Object.keys(TACTICS) as TacticId[], randomInt(1, 2))
  const speed = randomInt(2, 14)
  const smellStrength = pick(SMELL_STRENGTH_OPTIONS)

  return {
    id: uuidv4(),
    source: 'ai',
    latitude: roundCoordinate(lat),
    longitude: roundCoordinate(lng),
    createdAt: new Date().toISOString(),
    loggedAt: randomLoggedAt(),
    nickname: isAnimal ? pick(ANIMALS) : pick(AI_NAMES),
    gender: isAnimal ? null : pick([...AI_GENDERS]),
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
    dilutionRate: pick(DILUTION_RATES),
    socialImpact: pick(SOCIAL_IMPACTS),
    entityType,
    animalSpecies: isAnimal ? pick(ANIMALS) : null,
    observedConfirmed: false,
    photoDataUrl: null,
    photoTapX: null,
    photoTapY: null,
    blurConfirmed: false,
  }
}

export function generateAiLogsForLocation(lat: number, lng: number, count?: number): FartLog[] {
  const n = count ?? randomInt(4, 9)
  return Array.from({ length: n }, () => generateAiLog(lat, lng))
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
