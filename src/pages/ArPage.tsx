import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
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

export function ArPage() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const layerRef = useRef<HTMLDivElement>(null)
  const [markers, setMarkers] = useState<ArMarker[]>([])
  const [selected, setSelected] = useState<FartLog | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    let stream: MediaStream | null = null
    void (async () => {
      try {
        if (!navigator.mediaDevices?.getUserMedia) {
          throw new Error('この端末はカメラに対応していません')
        }
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: 'environment' } },
          audio: false,
        })
        if (videoRef.current) {
          videoRef.current.srcObject = stream
          await videoRef.current.play()
          setReady(true)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'カメラを起動できませんでした')
      }
    })()
    return () => {
      stream?.getTracks().forEach((t) => t.stop())
    }
  }, [])

  const handleTap = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!layerRef.current) return
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
  }, [])

  return (
    <div className="ar-page">
      <div className="ar-header">
        <h1>現場AR</h1>
        <p>カメラを向けて画面をタップ。黄色いモヤが浮かびます（写真鑑識のAR版）。</p>
      </div>

      {error && (
        <div className="ar-error">
          <p>{error}</p>
          <p className="hint">HTTPSで開いているか、カメラ許可を確認してください。</p>
          <Link to="/photo" className="btn">写真鑑識へ</Link>
        </div>
      )}

      {!error && (
        <div className="ar-viewport" ref={layerRef} onClick={(e) => void handleTap(e)}>
          <video ref={videoRef} className="ar-video" playsInline muted />
          {!ready && <div className="ar-loading">カメラ起動中…</div>}
          {markers.map((marker, index) => (
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
      )}

      <div className="ar-actions">
        <Link to="/log/new" className="btn btn-primary">ここにログを投稿する</Link>
        <Link to="/photo" className="btn">写真鑑識へ</Link>
      </div>

      <p className="ar-note">
        本格の空間認識AR（部屋に固定される3D）ではなく、カメラ映像の上にモヤを重ねる方式です。
        iPhoneでも動きやすい実装です。
      </p>

      {selected && <LogDetailModal log={selected} onClose={() => setSelected(null)} />}
    </div>
  )
}
