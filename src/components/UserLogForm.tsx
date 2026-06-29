import { useState } from 'react'
import { v4 as uuidv4 } from 'uuid'
import type { EntityType, FartLog, TacticId } from '../types'
import {
  BUSTED_COUNT_OTHER,
  FART_LOCATION_OPTIONS,
  ABOUT_USAGE_URL,
  SMELL_INTENSITY_OTHER,
  SMELL_STRENGTH_OPTIONS,
  SMELL_TYPE_OTHER,
  SMELL_TYPES,
  SOUND_CATEGORIES,
  SOUND_OPTIONS,
  SOUND_PRESET_OTHER,
  TACTICS,
  getSoundOption,
} from '../lib/constants'
import { estimateMethaneLevel } from '../lib/methaneConcentration'
import { geocodeManualPlace, reverseGeocodePlace } from '../lib/geocode'
import { getCurrentPosition, roundCoordinate } from '../lib/geo'
import { PREFECTURES, type PrefectureName } from '../lib/prefectures'
import { nowDatetimeLocalValue, toDatetimeLocalValue } from '../lib/datetimeLocal'
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
  smellTypeOther: string
  smellIntensity: number
  smellIntensityOther: string
  soundPreset: string
  soundOther: string
  bustedCount: number
  bustedOther: string
  tactics: TacticId[]
  tacticsOther: string
  entityType: EntityType
  animalSpecies: string
  observedConfirmed: boolean
  photoDataUrl: string | null
  photoTapX: number | null
  photoTapY: number | null
  blurConfirmed: boolean
  fartLocation: string
  fartLocationOther: string
  locationSource: 'gps' | 'manual'
  mapPrefecture: string | null
  mapCity: string | null
}

interface Props {
  mode: 'log_only' | 'with_photo'
  photoDataUrl?: string | null
  initialLog?: FartLog
  submitLabel?: string
  onSubmit: (data: UserLogFormData) => Promise<void>
}


export function logToFormData(log: FartLog): UserLogFormData {
  return {
    nickname: log.nickname,
    loggedAt: toDatetimeLocalValue(log.loggedAt),
    mainComponent: log.mainComponent,
    latitude: log.latitude,
    longitude: log.longitude,
    gender: log.gender ?? '',
    ageDisplay: log.ageDisplay ?? '',
    hideGender: log.hideGender,
    hideAge: log.hideAge,
    smellType: log.smellType,
    smellTypeOther: log.smellTypeOther ?? '',
    smellIntensity: log.smellIntensity,
    smellIntensityOther: log.smellIntensityOther ?? '',
    soundPreset: log.soundPreset,
    soundOther: log.soundOther ?? (log.soundPreset === SOUND_PRESET_OTHER ? log.soundText : ''),
    bustedCount: log.bustedCount,
    bustedOther: log.bustedOther ?? '',
    tactics: log.tactics,
    tacticsOther: log.tacticsOther ?? '',
    entityType: log.entityType,
    animalSpecies: log.animalSpecies ?? '',
    observedConfirmed: log.observedConfirmed,
    photoDataUrl: log.photoDataUrl,
    photoTapX: log.photoTapX,
    photoTapY: log.photoTapY,
    blurConfirmed: log.blurConfirmed,
    fartLocation: log.fartLocation ?? FART_LOCATION_OPTIONS[0],
    fartLocationOther: log.fartLocationOther ?? '',
    locationSource: log.locationSource ?? 'gps',
    mapPrefecture: log.mapPrefecture,
    mapCity: log.mapCity,
  }
}

export function UserLogForm({
  mode,
  photoDataUrl = null,
  initialLog,
  submitLabel = 'ログを投稿',
  onSubmit,
}: Props) {
  const defaults = initialLog ? logToFormData(initialLog) : null
  const [nickname, setNickname] = useState(defaults?.nickname ?? '')
  const [mainComponent, setMainComponent] = useState(defaults?.mainComponent ?? '')
  const [loggedAt, setLoggedAt] = useState(
    defaults?.loggedAt ?? nowDatetimeLocalValue(),
  )
  const [gender, setGender] = useState(defaults?.gender ?? '')
  const [ageDisplay, setAgeDisplay] = useState(defaults?.ageDisplay ?? '')
  const [hideGender, setHideGender] = useState(defaults?.hideGender ?? false)
  const [hideAge, setHideAge] = useState(defaults?.hideAge ?? false)
  const [smellType, setSmellType] = useState<typeof SMELL_TYPES[number]>(
    (defaults?.smellType as typeof SMELL_TYPES[number]) ?? SMELL_TYPES[0],
  )
  const [smellTypeOther, setSmellTypeOther] = useState(defaults?.smellTypeOther ?? '')
  const [smellIntensity, setSmellIntensity] = useState(defaults?.smellIntensity ?? 3)
  const [smellIntensityOther, setSmellIntensityOther] = useState(defaults?.smellIntensityOther ?? '')
  const [soundPreset, setSoundPreset] = useState(defaults?.soundPreset ?? 'small_pu')
  const [soundOther, setSoundOther] = useState(defaults?.soundOther ?? '')
  const [bustedCount, setBustedCount] = useState(defaults?.bustedCount ?? 0)
  const [bustedOther, setBustedOther] = useState(defaults?.bustedOther ?? '')
  const [tactics, setTactics] = useState<TacticId[]>(defaults?.tactics ?? [])
  const [tacticsOther, setTacticsOther] = useState(defaults?.tacticsOther ?? '')
  const [entityType, setEntityType] = useState<EntityType>(defaults?.entityType ?? 'human')
  const [animalSpecies, setAnimalSpecies] = useState(defaults?.animalSpecies ?? '')
  const [observedConfirmed, setObservedConfirmed] = useState(defaults?.observedConfirmed ?? false)
  const [latitude, setLatitude] = useState<number | null>(defaults?.latitude ?? null)
  const [longitude, setLongitude] = useState<number | null>(defaults?.longitude ?? null)
  const [photoTapX, setPhotoTapX] = useState<number | null>(defaults?.photoTapX ?? null)
  const [photoTapY, setPhotoTapY] = useState<number | null>(defaults?.photoTapY ?? null)
  const [blurConfirmed, setBlurConfirmed] = useState(defaults?.blurConfirmed ?? false)
  const [fartLocation, setFartLocation] = useState(
    defaults?.fartLocation ?? FART_LOCATION_OPTIONS[0],
  )
  const [fartLocationOther, setFartLocationOther] = useState(defaults?.fartLocationOther ?? '')
  const [locationMode, setLocationMode] = useState<'gps' | 'manual'>(
    defaults?.locationSource === 'manual' || defaults?.mapCity ? 'manual' : 'gps',
  )
  const [manualPrefecture, setManualPrefecture] = useState<PrefectureName>(
    (defaults?.mapPrefecture as PrefectureName | null) ?? '東京都',
  )
  const [manualCity, setManualCity] = useState(defaults?.mapCity ?? '')
  const [resolvedPlaceLabel, setResolvedPlaceLabel] = useState<string | null>(null)
  const [agreed, setAgreed] = useState(Boolean(initialLog))
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locating, setLocating] = useState(false)

  const soundText = soundPreset === SOUND_PRESET_OTHER
    ? soundOther
    : (getSoundOption(soundPreset)?.text ?? '')

  const toggleTactic = (id: TacticId) => {
    setTactics((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id],
    )
  }

  const handleLocate = async () => {
    setLocating(true)
    setError(null)
    setResolvedPlaceLabel(null)
    try {
      const pos = await getCurrentPosition({ highAccuracy: true, timeout: 20000 })
      const lat = roundCoordinate(pos.coords.latitude, 5)
      const lng = roundCoordinate(pos.coords.longitude, 5)
      setLatitude(lat)
      setLongitude(lng)
      const place = await reverseGeocodePlace(lat, lng)
      if (place.prefecture) {
        setResolvedPlaceLabel(
          place.city ? `${place.prefecture}（${place.city}）` : place.prefecture,
        )
      }
    } catch {
      setError('位置情報を取得できませんでした。都道府県＋市町村での入力も使えます。')
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
    if (locationMode === 'gps') {
      if (latitude == null || longitude == null) {
        setError('現在地を取得するか、都道府県＋市町村を選んでください')
        return
      }
    } else if (!manualCity.trim()) {
      setError('市町村を入力してください')
      return
    }
    if (fartLocation === 'その他' && !fartLocationOther.trim()) {
      setError('「その他」を選んだ場合は場所を入力してください')
      return
    }
    if (smellType === SMELL_TYPE_OTHER && !smellTypeOther.trim()) {
      setError('匂いの種類で「その他」を選んだ場合は内容を入力してください')
      return
    }
    if (smellIntensity === SMELL_INTENSITY_OTHER && !smellIntensityOther.trim()) {
      setError('匂いの強さで「その他」を選んだ場合は内容を入力してください')
      return
    }
    if (soundPreset === SOUND_PRESET_OTHER && !soundOther.trim()) {
      setError('音で「その他」を選んだ場合は内容を入力してください')
      return
    }
    if (bustedCount === BUSTED_COUNT_OTHER && !bustedOther.trim()) {
      setError('バレ度で「その他」を選んだ場合は内容を入力してください')
      return
    }
    if (tactics.includes('other') && !tacticsOther.trim()) {
      setError('戦術で「その他」を選んだ場合は内容を入力してください')
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
      let submitLat = latitude
      let submitLng = longitude
      let mapPrefecture: string | null = null
      let mapCity: string | null = null
      let locationSource: 'gps' | 'manual' = locationMode

      if (locationMode === 'gps') {
        submitLat = latitude!
        submitLng = longitude!
        const place = await reverseGeocodePlace(submitLat, submitLng)
        mapPrefecture = place.prefecture
        mapCity = place.city
      } else {
        const coords = await geocodeManualPlace(manualPrefecture, manualCity.trim())
        if (!coords) {
          setError('場所の座標を取得できませんでした。市町村名を見直してください。')
          return
        }
        submitLat = roundCoordinate(coords.lat, 5)
        submitLng = roundCoordinate(coords.lng, 5)
        mapPrefecture = manualPrefecture
        mapCity = manualCity.trim()
      }

      await onSubmit({
        nickname: nickname.trim(),
        loggedAt: new Date(loggedAt).toISOString(),
        mainComponent: mainComponent.trim(),
        latitude: submitLat,
        longitude: submitLng,
        gender,
        ageDisplay,
        hideGender,
        hideAge,
        smellType,
        smellTypeOther: smellType === SMELL_TYPE_OTHER ? smellTypeOther.trim() : '',
        smellIntensity,
        smellIntensityOther: smellIntensity === SMELL_INTENSITY_OTHER ? smellIntensityOther.trim() : '',
        soundPreset,
        soundOther: soundPreset === SOUND_PRESET_OTHER ? soundOther.trim() : '',
        bustedCount,
        bustedOther: bustedCount === BUSTED_COUNT_OTHER ? bustedOther.trim() : '',
        tactics,
        tacticsOther: tactics.includes('other') ? tacticsOther.trim() : '',
        entityType,
        animalSpecies,
        observedConfirmed,
        photoDataUrl: mode === 'with_photo' ? photoDataUrl : null,
        photoTapX: mode === 'with_photo' ? photoTapX : null,
        photoTapY: mode === 'with_photo' ? photoTapY : null,
        blurConfirmed: mode === 'with_photo' ? blurConfirmed : false,
        fartLocation,
        fartLocationOther: fartLocation === 'その他' ? fartLocationOther.trim() : '',
        locationSource,
        mapPrefecture,
        mapCity,
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

      <div className="field field-datetime">
        <label htmlFor="loggedAt">日時</label>
        <input
          id="loggedAt"
          type="datetime-local"
          className="datetime-input"
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

      <fieldset className="fieldset">
        <legend>地図に載せる場所 *</legend>
        <label className="radio">
          <input
            type="radio"
            checked={locationMode === 'gps'}
            onChange={() => {
              setLocationMode('gps')
              setResolvedPlaceLabel(null)
            }}
          />
          位置情報（GPS）を使う
        </label>
        <label className="radio">
          <input
            type="radio"
            checked={locationMode === 'manual'}
            onChange={() => {
              setLocationMode('manual')
              setLatitude(null)
              setLongitude(null)
              setResolvedPlaceLabel(null)
            }}
          />
          都道府県＋市町村を選ぶ
        </label>

        {locationMode === 'gps' ? (
          <>
            <button type="button" className="btn" onClick={() => void handleLocate()} disabled={locating}>
              {locating ? '取得中…' : '現在地を取得'}
            </button>
            {latitude != null && longitude != null && (
              <p className="hint">
                {resolvedPlaceLabel
                  ? `判定: ${resolvedPlaceLabel}`
                  : `座標: ${latitude}, ${longitude}`}
              </p>
            )}
          </>
        ) : (
          <div className="manual-location">
            <select
              value={manualPrefecture}
              onChange={(e) => setManualPrefecture(e.target.value as PrefectureName)}
            >
              {PREFECTURES.map((pref) => (
                <option key={pref.name} value={pref.name}>{pref.name}</option>
              ))}
            </select>
            <input
              value={manualCity}
              onChange={(e) => setManualCity(e.target.value)}
              placeholder="市町村（例: 大阪市、奈良市）"
              required={locationMode === 'manual'}
            />
          </div>
        )}
        <p className="hint">GPSは高精度で取得します。マップのピン位置は概算です。</p>
      </fieldset>

      <div className="field">
        <label htmlFor="fartLocation">放屁場所 *</label>
        <select
          id="fartLocation"
          value={fartLocation}
          onChange={(e) => setFartLocation(e.target.value)}
          required
        >
          {FART_LOCATION_OPTIONS.map((option) => (
            <option key={option} value={option}>{option}</option>
          ))}
        </select>
        {fartLocation === 'その他' && (
          <input
            className="fart-location-other"
            value={fartLocationOther}
            onChange={(e) => setFartLocationOther(e.target.value)}
            placeholder="場所を自由記述（例: 映画館、図書館）"
            required
          />
        )}
        <p className="hint">公共の場でのおならを推奨するものではありません。記録用の選択です。</p>
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
        <select
          id="smell"
          value={smellType}
          onChange={(e) => setSmellType(e.target.value as typeof SMELL_TYPES[number])}
        >
          {SMELL_TYPES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        {smellType === SMELL_TYPE_OTHER && (
          <input
            className="field-other"
            value={smellTypeOther}
            onChange={(e) => setSmellTypeOther(e.target.value)}
            placeholder="匂いを自由記述（例: 湿った雑誌の匂い）"
            required
          />
        )}
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
        {smellIntensity === SMELL_INTENSITY_OTHER && (
          <input
            className="field-other"
            value={smellIntensityOther}
            onChange={(e) => setSmellIntensityOther(e.target.value)}
            placeholder="強さを自由記述（例: 部屋中に広がった）"
            required
          />
        )}
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
        {soundPreset === SOUND_PRESET_OTHER ? (
          <input
            className="field-other"
            value={soundOther}
            onChange={(e) => setSoundOther(e.target.value)}
            placeholder="音を自由記述（例: プゥン…）"
            required
          />
        ) : (
          <p className="hint">音: {soundText}</p>
        )}
      </div>

      <div className="field">
        <label htmlFor="busted">バレ度</label>
        <select id="busted" value={bustedCount} onChange={(e) => setBustedCount(Number(e.target.value))}>
          {[0, 1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>{n}人</option>
          ))}
          <option value={BUSTED_COUNT_OTHER}>その他（自由記述）</option>
        </select>
        {bustedCount === BUSTED_COUNT_OTHER && (
          <input
            className="field-other"
            value={bustedOther}
            onChange={(e) => setBustedOther(e.target.value)}
            placeholder="バレ度を自由記述（例: 気配だけバレた）"
            required
          />
        )}
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
        {tactics.includes('other') && (
          <input
            className="field-other"
            value={tacticsOther}
            onChange={(e) => setTacticsOther(e.target.value)}
            placeholder="戦術を自由記述（例: 通話中に一瞬ミュート）"
            required
          />
        )}
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
        <a href={ABOUT_USAGE_URL} target="_blank" rel="noreferrer">使い方・注意事項</a>
        を読み、投稿内容に問題がないことを確認しました *
      </label>

      {error && <p className="error">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={loading}>
        {loading ? '保存中…' : submitLabel}
      </button>
    </form>
  )
}

export function formDataToLog(
  data: UserLogFormData,
  existing?: Pick<FartLog, 'id' | 'createdAt' | 'userId'>,
): FartLog {
  const soundText = data.soundPreset === SOUND_PRESET_OTHER
    ? data.soundOther.trim()
    : (getSoundOption(data.soundPreset)?.text ?? '')
  const draft: FartLog = {
    id: existing?.id ?? uuidv4(),
    userId: existing?.userId ?? null,
    source: 'user',
    latitude: data.latitude,
    longitude: data.longitude,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
    loggedAt: data.loggedAt,
    nickname: data.nickname,
    gender: data.gender || null,
    ageDisplay: data.ageDisplay || null,
    hideGender: data.hideGender,
    hideAge: data.hideAge,
    mainComponent: data.mainComponent,
    smellType: data.smellType,
    smellTypeOther: data.smellType === SMELL_TYPE_OTHER ? data.smellTypeOther || null : null,
    smellIntensity: data.smellIntensity,
    smellIntensityOther: data.smellIntensity === SMELL_INTENSITY_OTHER ? data.smellIntensityOther || null : null,
    soundText,
    soundPreset: data.soundPreset,
    soundOther: data.soundPreset === SOUND_PRESET_OTHER ? data.soundOther || null : null,
    bustedCount: data.bustedCount,
    bustedOther: data.bustedCount === BUSTED_COUNT_OTHER ? data.bustedOther || null : null,
    tactics: data.tactics,
    tacticsOther: data.tactics.includes('other') ? data.tacticsOther || null : null,
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
    fartLocation: data.fartLocation,
    fartLocationOther: data.fartLocationOther || null,
    locationSource: data.locationSource,
    mapPrefecture: data.mapPrefecture,
    mapCity: data.mapCity,
  }
  return {
    ...draft,
    dilutionRate: estimateMethaneLevel(draft),
  }
}
