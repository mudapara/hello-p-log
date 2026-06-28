import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { formDataToLog, UserLogForm, type UserLogFormData } from '../components/UserLogForm'
import { useAuth } from '../contexts/AuthContext'
import { awardMethanePointsForLog, getUserProfile } from '../lib/profileStore'
import { FEATURE_LOG_POST, FEATURE_MAP } from '../lib/constants'
import { saveLog } from '../lib/logStore'
import { renderCompositeImage } from '../components/PhotoCanvas'
import { getPlaceLabelFromCoords, shareLogPost } from '../lib/logShare'
import { CameraIcon } from '../components/CameraIcon'
import { MistIcon } from '../components/MistIcon'
import type { PhotoOverlayLog } from '../types'
import './NewLogPage.css'

type Mode = 'choose' | 'log_only' | 'with_photo'

export function NewLogPage() {
  const { user } = useAuth()
  const fileRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<Mode>('choose')
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [pointsEarned, setPointsEarned] = useState<number | null>(null)
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null)
  const [sharePlace, setSharePlace] = useState<string | null>(null)
  const [sharing, setSharing] = useState(false)
  const [shareMessage, setShareMessage] = useState<string | null>(null)
  const [lastPostCoords, setLastPostCoords] = useState<{ lat: number; lng: number } | null>(null)

  useEffect(() => {
    if (!successId || !lastPostCoords) return
    setSharePlace(getPlaceLabelFromCoords(lastPostCoords.lat, lastPostCoords.lng))
  }, [successId, lastPostCoords])

  const handlePhotoSelect = (file: File) => {
    const reader = new FileReader()
    reader.onload = () => {
      setPhotoDataUrl(reader.result as string)
      setMode('with_photo')
    }
    reader.readAsDataURL(file)
  }

  const handleSubmit = async (data: UserLogFormData) => {
    const log = formDataToLog(data)
    if (user?.id) {
      log.userId = user.id
    }
    await saveLog(log)
    setSuccessId(log.id)
    setPointsEarned(null)
    setSharePlace(null)
    setShareMessage(null)
    setLastPostCoords({ lat: log.latitude, lng: log.longitude })

    if (user?.id) {
      const before = await getUserProfile(user.id)
      const after = await awardMethanePointsForLog(user.id, log)
      setPointsEarned(after.methanePoints - before.methanePoints)
    }

    if (data.photoDataUrl && data.photoTapX != null && data.photoTapY != null) {
      const overlay: PhotoOverlayLog = {
        ...log,
        overlayX: data.photoTapX,
        overlayY: data.photoTapY,
      }
      const composite = await renderCompositeImage(data.photoDataUrl, [overlay], overlay)
      setDownloadUrl(composite)
    }
  }

  const handleShareLog = async () => {
    if (!sharePlace) return
    setSharing(true)
    setShareMessage(null)
    try {
      const result = await shareLogPost(sharePlace)
      setShareMessage(
        result === 'shared'
          ? 'シェアしました'
          : '文言をコピーしました。SNSに貼り付けてください',
      )
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') return
      setShareMessage('シェアに失敗しました')
    } finally {
      setSharing(false)
    }
  }

  if (successId) {
    return (
      <div className="new-log-page">
        <div className="success-card">
          <h1>投稿完了</h1>
          {sharePlace ? (
            <p className="share-place-msg">
              <strong>{sharePlace}</strong>にログを残しました
            </p>
          ) : null}
          <p>ログが{FEATURE_MAP.title}に反映されました。</p>
          {pointsEarned != null && pointsEarned > 0 && (
            <p className="points-toast">メタンポイント +{pointsEarned} pt</p>
          )}
          {!user && (
            <p className="hint">
              メタンポイント・称号は
              <Link to="/login">Googleログイン</Link>
              すると溜まります。
            </p>
          )}
          {downloadUrl && (
            <a className="btn btn-primary" href={downloadUrl} download={`hello-p-log-${successId}.jpg`}>
              合成画像をダウンロード
            </a>
          )}
          <button
            type="button"
            className="btn btn-primary share-log-btn"
            onClick={() => void handleShareLog()}
            disabled={!sharePlace || sharing}
          >
            {sharing ? '準備中…' : 'SNSでシェア'}
          </button>
          {shareMessage && <p className="share-message">{shareMessage}</p>}
          <div className="success-actions">
            <Link to="/map" className="btn">マップを見る</Link>
            <button type="button" className="btn btn-ghost" onClick={() => {
              setSuccessId(null)
              setPointsEarned(null)
              setDownloadUrl(null)
              setSharePlace(null)
              setShareMessage(null)
              setLastPostCoords(null)
              setMode('choose')
              setPhotoDataUrl(null)
            }}>
              もう1件投稿
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (mode === 'choose') {
    return (
      <div className="new-log-page">
        <h1>{FEATURE_LOG_POST.title}</h1>
        <p className="lead">ログだけ残すか、写真付きで残すか選んでください。</p>
        <div className="mode-cards">
          <button type="button" className="mode-card" onClick={() => setMode('log_only')}>
            <span className="mode-icon"><MistIcon large /></span>
            <strong>ログだけ</strong>
            <span>地図に痕跡を残す</span>
          </button>
          <button
            type="button"
            className="mode-card"
            onClick={() => fileRef.current?.click()}
          >
            <span className="mode-icon"><CameraIcon large /></span>
            <strong>写真も付ける</strong>
            <span>合成画像をDLできる</span>
          </button>
        </div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handlePhotoSelect(f)
          }}
        />
      </div>
    )
  }

  return (
    <div className="new-log-page">
      <button type="button" className="back-link" onClick={() => {
        setMode('choose')
        setPhotoDataUrl(null)
      }}>
        ← 戻る
      </button>
      <h1>{mode === 'log_only' ? 'ログだけ投稿' : '写真付き投稿'}</h1>
      {mode === 'with_photo' && photoDataUrl && (
        <img src={photoDataUrl} alt="選択した写真" className="photo-preview" />
      )}
      <UserLogForm
        mode={mode}
        photoDataUrl={photoDataUrl}
        onSubmit={handleSubmit}
      />
    </div>
  )
}
