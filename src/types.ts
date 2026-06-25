export type LogSource = 'ai' | 'user'
export type EntityType = 'human' | 'animal'
export type TacticId = 'rear_guard' | 'vortex' | 'sound_mask' | 'blame_shift'

export interface FartLog {
  id: string
  userId: string | null
  source: LogSource
  latitude: number
  longitude: number
  createdAt: string
  loggedAt: string
  nickname: string
  gender: string | null
  ageDisplay: string | null
  hideGender: boolean
  hideAge: boolean
  mainComponent: string
  smellType: string
  smellIntensity: number
  soundText: string
  soundPreset: string
  bustedCount: number
  tactics: TacticId[]
  releaseSpeedKmh: number | null
  releaseSpeedComparison: string | null
  dilutionRate: string | null
  socialImpact: string | null
  entityType: EntityType
  animalSpecies: string | null
  observedConfirmed: boolean
  photoDataUrl: string | null
  photoTapX: number | null
  photoTapY: number | null
  blurConfirmed: boolean
}

export interface ContactSubmission {
  id: string
  type: 'report' | 'delete' | 'other'
  logId: string | null
  message: string
  replyEmail: string | null
  createdAt: string
}

export interface PhotoOverlayLog extends FartLog {
  overlayX: number
  overlayY: number
}

export interface UserProfileStats {
  methanePoints: number
  totalLogs: number
  photoLogs: number
  silentLogs: number
  maxMethaneLevel: number
  uniquePrefectures: string[]
}

export type MistStyleId = 'default' | 'royal' | 'toxic' | 'rainbow' | 'ghost'

export interface UserProfile extends UserProfileStats {
  userId: string
  displayName: string | null
  unlockedTitles: string[]
  activeTitle: string | null
  activeMistStyle: MistStyleId
  lastLoginDate: string | null
}

export interface PrefectureRankingEntry {
  prefecture: string
  count: number
}

export interface UserRankingEntry {
  userId: string
  displayName: string
  methanePoints: number
  totalLogs: number
  activeTitle: string | null
  activeMistStyle: string
}
