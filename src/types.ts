export type LogSource = 'ai' | 'user'
export type EntityType = 'human' | 'animal'
export type TacticId = 'rear_guard' | 'vortex' | 'sound_mask' | 'blame_shift'

export interface FartLog {
  id: string
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
