import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { FEATURE_AR, FEATURE_PHOTO } from '../lib/constants'
import { generateAiLog } from '../lib/aiLogGenerator'
import { getCurrentPosition, roundCoordinate } from '../lib/geo'
import type { FartLog } from '../types'
import { LogDetailModal } from '../components/LogDetailModal'
import './ArPage.css'
import '../components/PhotoCanvas.css'

interface ArMarker {
  id: string
  x: number
  y: number
  log: FartLog
}

type CameraPhase = 'idle' | 'starting' | 'ready' | 'error'

function formatCameraError(error: unknown): string {
  if (error instanceof DOMException) {
    switch (error.name) {
      case 'NotAllowedError':
        return 'カメラの使用が拒否されました。「カメラを起動」を押すか、ブラウザのアドレスバー付近でカメラを「許可」にしてください。'
      case 'NotFoundError':
        return 'カメラが見つかりません。PCの場合はWebカメラの接続を確認してください。'
      case 'NotReadableError':
        return 'カメラを開けませんでした。他のアプリがカメラを使っていないか確認してください。'
      case 'SecurityError':
        return 'セキュリティ上、カメラを使えません。https://www.hello-p-log.com など HTTPS のURLで開いてください。'
      default:
        return error.message || 'カメラを起動できませんでした'
    }
  }
  if (error instanceof Error) return error.message
  return 'カメラを起動できませんでした'
}

async function requestCameraStream(): Promise<MediaStream> {
  if (!navigator.mediaDevices?.getUserMedia) {
    throw new Error('この端末・ブラウザはカメラに対応していません')
  }

  const attempts: MediaStreamConstraints[] = [
    { video: { facingMode: { ideal: 'environment' } }, audio: false },
    { video: { facingMode: 'user' }, audio: false },
    { video: true, audio: false },
  ]

  let lastError: unknown
  for (const constraints of attempts) {
    try {
      return await navigator.mediaDevices.getUserMedia(constraints)
    } catch (error) {
      lastError = error
      if (error instanceof DOMException && error.name === 'NotAllowedError') {
        throw error
      }
    }
  }
  throw lastError ?? new Error('カメラを起動できませんでした')
}

export function ArPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const [markers, setMarkers] = useState<ArMarker[]>([])
  const [selected, setSelected] = useState<FartLog | null>(null)
  const [phase, setPhase] = useState<CameraPhase>('idle')
  const [error, setError] = useState<string | null>(null)

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((track) => track.stop())
    streamRef.current = null
    if (videoRef.current) {
      videoRef.current.srcObject = null
    }
  }, [])

  const startCamera = useCallback(async () => {
    setError(null)
    setPhase('starting')
    stopCamera()

    try {
      const stream = await requestCameraStream()
      streamRef.current = stream

      const video = videoRef.current
      if (!video) {
        stream.getTracks().forEach((track) => track.stop())
        throw new Error('映像の表示準備に失敗しました。もう一度お試しください。')
      }

      video.srcObject = stream
      await video.play()
      setPhase('ready')
    } catch (e) {
      stopCamera()
      setError(formatCameraError(e))
      setPhase('error')
    }
  }, [stopCamera])

  useEffect(() => () => stopCamera(), [stopCamera])

  const handleTap = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (phase !== 'ready' || !layerRef.current) return
    const rect = layerRef.current.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height

    let lat = 35.6812
    let lng = 139.7671
    try {
      const pos = await getCurrentPosition({ timeout: 4000, highAccuracy: false })
      lat = roundCoordinate(pos.coords.latitude)
      lng = roundCoordinate(pos.coords.longitude)
    } catch {
      // GPSなしでもAR体験は続行
    }

    const log = generateAiLog(lat, lng)
    const marker: ArMarker = {
      id: `${Date.now()}-${Math.random()}`,
      x,
      y,
      log,
    }
    setMarkers((prev) => [...prev, marker])
  }, [phase])

  return (
    <div className="ar-page">
      <div className="ar-header">
        <h1>{FEATURE_AR.title}</h1>
        <p>カメラを向けて画面をタップ。映像の上に黄色いモヤが浮かび、タップでメタン情報が見られます。</p>
      </div>

      <div className="ar-viewport" ref={layerRef} onClick={(e) => void handleTap(e)}>
        <video ref={videoRef} className="ar-video" playsInline muted autoPlay />

        {phase === 'idle' && (
          <div className="ar-start-panel">
            <p>カメラの使用許可が必要です。</p>
            <button type="button" className="btn btn-primary" onClick={() => void startCamera()}>
              カメラを起動
            </button>
          </div>
        )}

        {phase === 'starting' && (
          <div className="ar-loading">カメラ起動中…</div>
        )}

        {phase === 'error' && (
          <div className="ar-start-panel ar-start-panel--error">
            <p>{error}</p>
            <button type="button" className="btn btn-primary" onClick={() => void startCamera()}>
              もう一度試す
            </button>
            <Link to="/photo" className="btn">{FEATURE_PHOTO.nav}へ</Link>
          </div>
        )}

        {phase === 'ready' &&
          markers.map((marker, index) => (
            <button
              key={marker.id}
              type="button"
              className="mist-marker mist-ai ar-mist"
              style={{
                left: `${marker.x * 100}%`,
                top: `${marker.y * 100}%`,
                animationDelay: `${index * 0.2}s`,
              }}
              onClick={(e) => {
                e.stopPropagation()
                setSelected(marker.log)
              }}
            >
              <span className="mist-blob mist-blob-1" />
              <span className="mist-blob mist-blob-2" />
              <span className="mist-blob mist-blob-3" />
            </button>
          ))}
      </div>

      {phase === 'ready' && (
        <p className="ar-hint">映像をタップすると、その位置に黄色いモヤが出ます。</p>
      )}

      <div className="ar-actions">
        <Link to="/log/new" className="btn btn-primary">ここにログを投稿する</Link>
        <Link to="/photo" className="btn">{FEATURE_PHOTO.nav}へ</Link>
      </div>

      <p className="ar-note">
        本格の空間認識AR（部屋に固定される3D）ではなく、カメラ映像の上にモヤを重ねる方式です。
        iPhoneでも動きやすい実装です。
      </p>

      {selected && <LogDetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
