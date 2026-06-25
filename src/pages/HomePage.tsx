import { useRef, useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { generateAiLogsForLocation, mergeLogsForPhoto } from '../lib/aiLogGenerator'
import { getCurrentPosition, roundCoordinate } from '../lib/geo'
import { findNearbyUserLogs } from '../lib/logStore'
import { detectGroundLineY, detectPhotoScene } from '../lib/photoPosition'
import { buildUserMistStyleMap, getMistStyleClass } from '../lib/profileStore'
import { extractGpsFromImageFile } from '../lib/exifGps'
import { renderShareImage, shareOrDownloadImage } from '../lib/shareImage'
import type { PhotoOverlayLog } from '../types'
import { PhotoCanvas } from '../components/PhotoCanvas'
import './HomePage.css'

function withTimeout<T>(promise: Promise<T>, ms: number, fallback: T): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((resolve) => setTimeout(() => resolve(fallback), ms)),
  ])
}

function isImageFile(file: File): boolean {
  if (file.type.startsWith('image/')) return true
  return /\.(jpe?g|png|gif|webp|heic|heif)$/i.test(file.name)
}

const EXIF_CONSENT_KEY = 'hello-p-log:exif-consent'

export function HomePage() {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [overlayLogs, setOverlayLogs] = useState<PhotoOverlayLog[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [mistStyles, setMistStyles] = useState<Map<string, string>>(new Map())
  const [exifConsent, setExifConsent] = useState(
    () => localStorage.getItem(EXIF_CONSENT_KEY) === 'true',
  )

  useEffect(() => {
    if (!overlayLogs) {
      setMistStyles(new Map())
      return
    }
    void buildUserMistStyleMap(overlayLogs, user?.id ?? null).then((styleMap) => {
      const map = new Map<string, string>()
      for (const [key, style] of styleMap) {
        const cls = getMistStyleClass(style)
        if (cls) map.set(key, cls)
      }
      setMistStyles(map)
    })
  }, [overlayLogs, user?.id])

  const analyzePhoto = async (dataUrl: string, file?: File) => {
    setLoading(true)
    setError(null)
    setPhotoUrl(dataUrl)
    setOverlayLogs(null)
    setLocationLabel(null)

    try {
      const [geoPos, exifGps, groundY, photoScene] = await Promise.all([
        withTimeout(
          getCurrentPosition({ timeout: 8000, highAccuracy: false }).catch(() => null),
          9000,
          null,
        ),
        file ? (exifConsent ? extractGpsFromImageFile(file) : Promise.resolve(null)) : Promise.resolve(null),
        detectGroundLineY(dataUrl),
        detectPhotoScene(dataUrl),
      ])

      let lat: number
      let lng: number
      if (exifGps) {
        lat = roundCoordinate(exifGps.latitude)
        lng = roundCoordinate(exifGps.longitude)
        setLocationLabel(`写真の位置情報（EXIF）: ${lat}, ${lng}`)
      } else if (geoPos) {
        lat = roundCoordinate(geoPos.coords.latitude)
        lng = roundCoordinate(geoPos.coords.longitude)
        setLocationLabel(`現在地（概算）: ${lat}, ${lng}`)
      } else {
        lat = 35.6812
        lng = 139.7671
        setLocationLabel(
          '位置情報なし → 東京駅付近として生成（ブラウザの位置許可、または撮影時の位置情報オンをお試しください）',
        )
      }

      const aiScene =
        photoScene === 'indoor' ? 'indoor' : photoScene === 'outdoor' ? 'outdoor' : 'any'
      const aiLogs = generateAiLogsForLocation(lat, lng, undefined, { scene: aiScene })
      const nearbyUsers = await withTimeout(findNearbyUserLogs(lat, lng), 8000, [])
      const merged = mergeLogsForPhoto(aiLogs, nearbyUsers, groundY)
      setOverlayLogs(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file: File) => {
    if (!isImageFile(file)) {
      setError('画像ファイルを選択してください')
      return
    }
    setError(null)
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        void analyzePhoto(reader.result, file)
      } else {
        setError('画像の読み込みに失敗しました')
      }
    }
    reader.onerror = () => {
      setError('画像の読み込みに失敗しました')
    }
    reader.readAsDataURL(file)
  }

  const handleShare = async () => {
    if (!photoUrl || !overlayLogs) return
    setSharing(true)
    setShareMessage(null)
    setError(null)
    try {
      const blob = await renderShareImage(photoUrl, overlayLogs)
      const result = await shareOrDownloadImage(blob, `hello-p-log-${Date.now()}.jpg`)
      setShareMessage(
        result === 'shared'
          ? 'シェアしました（文言とURL付き）'
          : '画像を保存しました。SNSに貼り付けてください',
      )
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setError(e instanceof Error ? e.message : 'シェア画像の作成に失敗しました')
    } finally {
      setSharing(false)
    }
  }

  return (
    <div className="home-page">
      <section className="hero">
        <h1>写真鑑識</h1>
        <p className="lead">
          写真をアップすると、オナラログが浮かび上がります。
        </p>
      </section>

      <div className="upload-actions upload-actions--stack">
        <fieldset className="exif-choice">
          <legend>写真の位置情報</legend>
          <label className="exif-option">
            <input
              type="radio"
              name="exif-consent"
              checked={exifConsent}
              onChange={() => {
                setExifConsent(true)
                localStorage.setItem(EXIF_CONSENT_KEY, 'true')
              }}
            />
            <span>写真に含まれる位置情報を使用する</span>
          </label>
          <label className="exif-option">
            <input
              type="radio"
              name="exif-consent"
              checked={!exifConsent}
              onChange={() => {
                setExifConsent(false)
                localStorage.setItem(EXIF_CONSENT_KEY, 'false')
              }}
            />
            <span>写真に含まれる位置情報を使用しない</span>
          </label>
        </fieldset>
        <button type="button" className="btn btn-primary btn-block" onClick={() => fileRef.current?.click()}>
          写真を選ぶ
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden-input"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>

      {loading && <p className="status">解析中…ログを生成しています</p>}
      {error && <p className="error">{error}</p>}
      {locationLabel && <p className="hint">{locationLabel}</p>}

      {photoUrl && overlayLogs && (
        <section className="result">
          <h2>鑑識結果</h2>
          <p className="hint">
            黄色いモヤをタップするとメタン情報が見られます（全{overlayLogs.length}件）
          </p>
          <PhotoCanvas photoUrl={photoUrl} logs={overlayLogs} mistStyles={mistStyles} />
          <p className="legend">
            <span className="dot dot-ai" /> 淡い黄色＝AI
            <span className="dot dot-user" /> 濃い黄色＋キラキラ＝ユーザー
          </p>
          <div className="result-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={sharing}
              onClick={() => void handleShare()}
            >
              {sharing ? '画像を作成中…' : 'SNSでシェア'}
            </button>
          </div>
          {shareMessage && <p className="share-message">{shareMessage}</p>}
        </section>
      )}
    </div>
  )
}
