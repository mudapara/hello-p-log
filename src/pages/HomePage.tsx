import { useEffect, useRef, useState } from 'react'
import { generateAiLogsForLocation, mergeLogsForPhoto } from '../lib/aiLogGenerator'
import { getCurrentPosition, roundCoordinate } from '../lib/geo'
import { findNearbyUserLogs } from '../lib/logStore'
import { detectGroundLineY, detectPhotoScene } from '../lib/photoPosition'
import type { PhotoOverlayLog } from '../types'
import { PhotoCanvas } from '../components/PhotoCanvas'
import './HomePage.css'

export function HomePage() {
  const fileRef = useRef<HTMLInputElement>(null)
  const cameraRef = useRef<HTMLInputElement>(null)
  const [isMobile, setIsMobile] = useState(false)
  const [photoUrl, setPhotoUrl] = useState<string | null>(null)
  const [overlayLogs, setOverlayLogs] = useState<PhotoOverlayLog[] | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [locationLabel, setLocationLabel] = useState<string | null>(null)

  useEffect(() => {
    const ua = navigator.userAgent
    setIsMobile(/Android|iPhone|iPad|iPod|Mobile/i.test(ua))
  }, [])

  const analyzePhoto = async (dataUrl: string) => {
    setLoading(true)
    setError(null)
    setPhotoUrl(dataUrl)
    setOverlayLogs(null)

    try {
      let lat: number
      let lng: number

      try {
        const pos = await getCurrentPosition()
        lat = roundCoordinate(pos.coords.latitude)
        lng = roundCoordinate(pos.coords.longitude)
        setLocationLabel(`現在地（概算）: ${lat}, ${lng}`)
      } catch {
        lat = 35.6812
        lng = 139.7671
        setLocationLabel('位置情報なし → 東京駅付近として生成')
      }

      const groundY = await detectGroundLineY(dataUrl)
      const photoScene = await detectPhotoScene(dataUrl)
      const aiScene =
        photoScene === 'indoor' ? 'indoor' : photoScene === 'outdoor' ? 'outdoor' : 'any'
      const aiLogs = generateAiLogsForLocation(lat, lng, undefined, { scene: aiScene })
      const nearbyUsers = await findNearbyUserLogs(lat, lng)
      const merged = mergeLogsForPhoto(aiLogs, nearbyUsers, groundY)
      setOverlayLogs(merged)
    } catch (e) {
      setError(e instanceof Error ? e.message : '解析に失敗しました')
    } finally {
      setLoading(false)
    }
  }

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('画像ファイルを選択してください')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      void analyzePhoto(reader.result as string)
    }
    reader.readAsDataURL(file)
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
        {isMobile && (
          <button type="button" className="btn btn-primary btn-block" onClick={() => cameraRef.current?.click()}>
            写真を撮影する
          </button>
        )}
        <button type="button" className={`btn btn-block${isMobile ? '' : ' btn-primary'}`} onClick={() => fileRef.current?.click()}>
          写真を選ぶ
        </button>
        {isMobile && (
          <input
            ref={cameraRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden-input"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              e.target.value = ''
            }}
          />
        )}
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
        {isMobile && <p className="hint">撮影・アルバムのどちらでもOK</p>}
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
          <PhotoCanvas photoUrl={photoUrl} logs={overlayLogs} />
          <p className="legend">
            <span className="dot dot-ai" /> AI
            <span className="dot dot-user" /> 現地（ユーザー投稿）
          </p>
        </section>
      )}
    </div>
  )
}
