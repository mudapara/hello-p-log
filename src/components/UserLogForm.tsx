import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { EntityType, FartLog, TacticId } from '../types'
import {
  SMELL_STRENGTH_OPTIONS,
  SMELL_TYPES,
  SOUND_CATEGORIES,
  SOUND_OPTIONS,
  TACTICS,
  getSoundOption,
} from '../lib/constants'
import { getCurrentPosition, roundCoordinate } from '../lib/geo'
import './UserLogForm.css'

export interface UserLogFormData {
  nickname: string
  loggedAt: string
  mainComponent: string
  latitude: number
  longitude: number
  gender: string
  ageDisplay: string
  hideGender: boolean
  hideAge: boolean
  smellType: string
  smellIntensity: number
  soundPreset: string
  bustedCount: number
  tactics: TacticId[]
  entityType: EntityType
  animalSpecies: string
  observedConfirmed: boolean
  photoDataUrl: string | null
  photoTapX: number | null
  photoTapY: number | null
  blurConfirmed: boolean
}

interface Props {
  mode: 'log_only' | 'with_photo'
  photoDataUrl?: string | null
  onSubmit: (data: UserLogFormData) => Promise<void>
}

export function UserLogForm({ mode, photoDataUrl = null, onSubmit }: Props) {
  const [nickname, setNickname] = useState('')
  const [mainComponent, setMainComponent] = useState('')
  const [loggedAt, setLoggedAt] = useState(() => new Date().toISOString().slice(0, 16))
  const [gender, setGender] = useState('')
  const [ageDisplay, setAgeDisplay] = useState('')
  const [hideGender, setHideGender] = useState(false)
  const [hideAge, setHideAge] = useState(false)
  const [smellType, setSmellType] = useState(SMELL_TYPES[0])
  const [smellIntensity, setSmellIntensity] = useState(3)
  const [soundPreset, setSoundPreset] = useState('small_pu')
  const [bustedCount, setBustedCount] = useState(0)
  const [tactics, setTactics] = useState<TacticId[]>([])
  const [entityType, setEntityType] = useState<EntityType>('human')
  const [animalSpecies, setAnimalSpecies] = useState('')
  const [observedConfirmed, setObservedConfirmed] = useState(false)
  const [latitude, setLatitude] = useState<number | null>(null)
  const [longitude, setLongitude] = useState<number | null>(null)
  const [photoTapX, setPhotoTapX] = useState<number | null>(null)
  const [photoTapY, setPhotoTapY] = useState<number | null>(null)
  const [blurConfirmed, setBlurConfirmed] = useState(false)
  const [agreed, setAgreed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const soundText = getSoundOption(soundPreset)?.text ?? ''

  const toggleTactic = (id: TacticId) => {
    setTactics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const handleLocate = async () => {
    setLocating(true)
    setError(null)
    try {
      const pos = await getCurrentPosition()
      setLatitude(roundCoordinate(pos.coords.latitude))
      setLongitude(roundCoordinate(pos.coords.longitude))
    } catch {
      setError('位置情報を取得できませんでした。ブラウザの設定を確認してください。')
    } finally {
      setLocating(false)
    }
  }

  const handlePhotoTap = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!photoDataUrl) return
    const rect = e.currentTarget.getBoundingClientRect()
    const rawX = (e.clientX - rect.left) / rect.width
    const rawY = (e.clientY - rect.top) / rect.height
    setPhotoTapX(rawX)
    setPhotoTapY(rawY)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!nickname.trim()) {
      setError('ニックネームを入力してください')
      return
    }
    if (!mainComponent.trim()) {
      setError('直前に食べたものを入力してください')
      return
    }
    if (latitude == null || longitude == null) {
      setError('位置情報を取得してください')
      return
    }
    if (!agreed) {
      setError('使い方・注意事項への同意が必要です')
      return
    }
    if (entityType === 'animal' && !observedConfirmed) {
      setError('動物のログは「確認した」にチェックを入れてください')
      return
    }
    if (mode === 'with_photo') {
      if (!photoDataUrl) {
        setError('写真を選択してください')
        return
      }
      if (!blurConfirmed) {
        setError('第三者のぼかしを確認してください')
        return
      }
      if (photoTapX == null || photoTapY == null) {
        setError('写真上で放出位置をタップしてください')
        return
      }
    }

    setLoading(true)
    try {
      await onSubmit({
        nickname: nickname.trim(),
        loggedAt: new Date(loggedAt).toISOString(),
        mainComponent: mainComponent.trim(),
        latitude,
        longitude,
        gender,
        ageDisplay,
        hideGender,
        hideAge,
        smellType,
        smellIntensity,
        soundPreset,
        bustedCount,
        tactics,
        entityType,
        animalSpecies,
        observedConfirmed,
        photoDataUrl: mode === 'with_photo' ? photoDataUrl : null,
        photoTapX: mode === 'with_photo' ? photoTapX : null,
        photoTapY: mode === 'with_photo' ? photoTapY : null,
        blurConfirmed: mode === 'with_photo' ? blurConfirmed : false,
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : '投稿に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form className="user-log-form" onSubmit={(e) => void handleSubmit(e)}>
      <div className="field">
        <label htmlFor="nickname">ニックネーム *</label>
        <input
          id="nickname"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="例: タロウ"
          required
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="loggedAt">日時</label>
          <input
            id="loggedAt"
            type="datetime-local"
            value={loggedAt}
            onChange={(e) => setLoggedAt(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="food">直前に食べたもの *</label>
          <input
            id="food"
            value={mainComponent}
            onChange={(e) => setMainComponent(e.target.value)}
            placeholder="例: 焼き芋、ラーメン、ビール"
            required
          />
          <p className="hint">詳細画面では「主成分」として表示されます</p>
        </div>
      </div>

      <div className="field">
        <label>位置情報 *</label>
        <button type="button" className="btn" onClick={() => void handleLocate()} disabled={locating}>
          {locating ? '取得中…' : '現在地を取得'}
        </button>
        {latitude != null && longitude != null && (
          <p className="hint">概算: {latitude}, {longitude}</p>
        )}
      </div>

      <fieldset className="fieldset">
        <legend>実体</legend>
        <label className="radio">
          <input type="radio" checked={entityType === 'human'} onChange={() => setEntityType('human')} />
          人間
        </label>
        <label className="radio">
          <input type="radio" checked={entityType === 'animal'} onChange={() => setEntityType('animal')} />
          動物・虫
        </label>
        {entityType === 'animal' && (
          <>
            <input
              placeholder="種類（例: リス）"
              value={animalSpecies}
              onChange={(e) => setAnimalSpecies(e.target.value)}
            />
            <label className="checkbox">
              <input
                type="checkbox"
                checked={observedConfirmed}
                onChange={(e) => setObservedConfirmed(e.target.checked)}
              />
              確認した（目撃・確認済み）
            </label>
          </>
        )}
      </fieldset>

      {entityType === 'human' && (
        <div className="field-row">
          <div className="field">
            <label htmlFor="gender">性別（任意）</label>
            <select id="gender" value={gender} onChange={(e) => setGender(e.target.value)} disabled={hideGender}>
              <option value="">未入力</option>
              <option value="男">男</option>
              <option value="女">女</option>
              <option value="その他">その他</option>
            </select>
            <label className="checkbox">
              <input type="checkbox" checked={hideGender} onChange={(e) => setHideGender(e.target.checked)} />
              非表示
            </label>
          </div>
          <div className="field">
            <label htmlFor="age">年齢（任意）</label>
            <input
              id="age"
              value={ageDisplay}
              onChange={(e) => setAgeDisplay(e.target.value)}
              placeholder="例: 20代前半"
              disabled={hideAge}
            />
            <label className="checkbox">
              <input type="checkbox" checked={hideAge} onChange={(e) => setHideAge(e.target.checked)} />
              非表示
            </label>
          </div>
        </div>
      )}

      <div className="field">
        <label htmlFor="smell">匂いの種類</label>
        <select id="smell" value={smellType} onChange={(e) => setSmellType(e.target.value)}>
          {SMELL_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
      </div>

      <fieldset className="fieldset">
        <legend>匂いの強さ</legend>
        <div className="strength-options">
          {SMELL_STRENGTH_OPTIONS.map((opt) => (
            <label key={opt.value} className="strength-option">
              <input
                type="radio"
                name="smellStrength"
                checked={smellIntensity === opt.value}
                onChange={() => setSmellIntensity(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="sound">音</label>
        <select id="sound" value={soundPreset} onChange={(e) => setSoundPreset(e.target.value)}>
          {SOUND_CATEGORIES.map((cat) => (
            <optgroup key={cat} label={cat}>
              {SOUND_OPTIONS.filter((s) => s.category === cat).map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </optgroup>
          ))}
        </select>
        <p className="hint">音: {soundText}</p>
      </div>

      <div className="field">
        <label htmlFor="busted">バレ度</label>
        <select id="busted" value={bustedCount} onChange={(e) => setBustedCount(Number(e.target.value))}>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}人</option>
          ))}
        </select>
      </div>

      <fieldset className="fieldset">
        <legend>戦術（任意）</legend>
        <div className="tactic-cards">
          {(Object.keys(TACTICS) as TacticId[]).map((id) => (
            <label key={id} className={`tactic-card ${tactics.includes(id) ? 'selected' : ''}`}>
              <input
                type="checkbox"
                checked={tactics.includes(id)}
                onChange={() => toggleTactic(id)}
              />
              <span className="tactic-card-label">{TACTICS[id].label}</span>
              <span className="tactic-card-desc">{TACTICS[id].description}</span>
            </label>
          ))}
        </div>
      </fieldset>

      {mode === 'with_photo' && photoDataUrl && (
        <div className="field">
          <label>放出位置をタップ *</label>
          <p className="hint">タップした位置にログが表示されます</p>
          <div className="photo-tap-area" onClick={handlePhotoTap} role="presentation">
            <img src={photoDataUrl} alt="投稿写真" />
            {photoTapX != null && photoTapY != null && (
              <span
                className="tap-mist"
                style={{ left: `${photoTapX * 100}%`, top: `${photoTapY * 100}%` }}
              />
            )}
          </div>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={blurConfirmed}
              onChange={(e) => setBlurConfirmed(e.target.checked)}
            />
            第三者が写っている場合はぼかし済みです *
          </label>
        </div>
      )}

      <label className="checkbox agree">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} />
        <a href="/about" target="_blank" rel="noreferrer">使い方・注意事項</a>
        を読み、投稿内容に問題がないことを確認しました *
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? '投稿中…' : 'ログを投稿'}
      </button>
    </form>
  )
}

export function formDataToLog(data: UserLogFormData): FartLog {
  const soundText = getSoundOption(data.soundPreset)?.text ?? ''
  return {
    id: uuidv4(),
    source: 'user',
    latitude: data.latitude,
    longitude: data.longitude,
    createdAt: new Date().toISOString(),
    loggedAt: data.loggedAt,
    nickname: data.nickname,
    gender: data.gender || null,
    ageDisplay: data.ageDisplay || null,
    hideGender: data.hideGender,
    hideAge: data.hideAge,
    mainComponent: data.mainComponent,
    smellType: data.smellType,
    smellIntensity: data.smellIntensity,
    soundText,
    soundPreset: data.soundPreset,
    bustedCount: data.bustedCount,
    tactics: data.tactics,
    releaseSpeedKmh: null,
    releaseSpeedComparison: null,
    dilutionRate: null,
    socialImpact: null,
    entityType: data.entityType,
    animalSpecies: data.animalSpecies || null,
    observedConfirmed: data.observedConfirmed,
    photoDataUrl: data.photoDataUrl,
    photoTapX: data.photoTapX,
    photoTapY: data.photoTapY,
    blurConfirmed: data.blurConfirmed,
  }
}
