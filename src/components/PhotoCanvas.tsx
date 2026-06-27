import { useCallback, useLayoutEffect, useRef, useState } from 'react'
import type { PhotoOverlayLog } from '../types'
import { LogDetailModal } from './LogDetailModal'
import './PhotoCanvas.css'

interface Props {
  photoUrl: string
  logs: PhotoOverlayLog[]
  mistStyles?: Map<string, string>
}

export function PhotoCanvas({ photoUrl, logs, mistStyles }: Props) {
  const [selected, setSelected] = useState<PhotoOverlayLog | null>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [layout, setLayout] = useState({ w: 0, h: 0 })

  const syncLayout = useCallback(() => {
    const img = imgRef.current
    if (!img) return
    const w = img.clientWidth
    const h = img.clientHeight
    if (w > 0 && h > 0) {
      setLayout((prev) => (prev.w === w && prev.h === h ? prev : { w, h }))
    }
  }, [])

  useLayoutEffect(() => {
    syncLayout()
    const img = imgRef.current
    if (!img) return

    const observer = new ResizeObserver(() => syncLayout())
    observer.observe(img)
    window.addEventListener('resize', syncLayout)
    window.addEventListener('orientationchange', syncLayout)

    return () => {
      observer.disconnect()
      window.removeEventListener('resize', syncLayout)
      window.removeEventListener('orientationchange', syncLayout)
    }
  }, [photoUrl, syncLayout])

  return (
    <>
      <div className="photo-canvas">
        <div className="photo-canvas-frame">
          <img
            ref={imgRef}
            src={photoUrl}
            alt="選択した写真"
            className="photo-bg"
            onLoad={syncLayout}
          />
          {layout.h > 0 && (
            <div
              className="photo-overlay-layer"
              style={{ width: layout.w, height: layout.h }}
            >
              {logs.map((log, index) => {
                const premium = log.source === 'user'
                  ? (mistStyles?.get(log.userId ?? '') ?? mistStyles?.get(log.id) ?? '')
                  : ''
                return (
                  <button
                    key={log.id}
                    type="button"
                    className={`mist-marker ${log.source === 'user' ? 'mist-user' : 'mist-ai'} ${premium ?? ''}`}
                    style={{
                      left: `${log.overlayX * layout.w}px`,
                      top: `${log.overlayY * layout.h}px`,
                      zIndex: 3 + index,
                      animationDelay: `${index * 0.35}s`,
                    }}
                    onClick={() => setSelected(log)}
                    aria-label={`${log.nickname}のログ（${log.source === 'user' ? 'ユーザー' : 'AI'}）`}
                  >
                    <span className="mist-blob mist-blob-1" />
                    <span className="mist-blob mist-blob-2" />
                    <span className="mist-blob mist-blob-3" />
                    {log.source === 'user' && (
                      <>
                        <span className="mist-spark mist-spark-1" />
                        <span className="mist-spark mist-spark-2" />
                        <span className="mist-spark mist-spark-3" />
                      </>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </div>
      {selected && <LogDetailModal log={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

export async function renderCompositeImage(
  photoUrl: string,
  logs: PhotoOverlayLog[],
  primaryLog?: PhotoOverlayLog,
): Promise<string> {
  const img = await loadImage(photoUrl)
  const canvas = document.createElement('canvas')
  canvas.width = img.width
  canvas.height = img.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.drawImage(img, 0, 0)

  for (const log of logs) {
    const x = log.overlayX * canvas.width
    const y = log.overlayY * canvas.height
    drawMist(ctx, x, y, log.source === 'user')
  }

  if (primaryLog) {
    const cardW = Math.min(280, canvas.width * 0.4)
    const cardH = 72
    const cardX = canvas.width - cardW - 12
    const cardY = canvas.height - cardH - 12
    ctx.fillStyle = 'rgba(255, 255, 255, 0.92)'
    ctx.beginPath()
    ctx.roundRect(cardX, cardY, cardW, cardH, 8)
    ctx.fill()
    ctx.fillStyle = '#5d4037'
    ctx.font = 'bold 14px sans-serif'
    ctx.fillText(primaryLog.nickname, cardX + 10, cardY + 22)
    ctx.font = '12px sans-serif'
    ctx.fillText(`主成分: ${primaryLog.mainComponent}`, cardX + 10, cardY + 42)
    ctx.fillText(`音: ${primaryLog.soundText}`, cardX + 10, cardY + 58)
  }

  return canvas.toDataURL('image/jpeg', 0.9)
}

function drawMist(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  isUser: boolean,
) {
  const scale = Math.max(1, ctx.canvas.width / 720) * (isUser ? 1.08 : 1)
  const offsets = [
    { dx: 0, dy: 0, r: 50 * scale },
    { dx: -18 * scale, dy: -10 * scale, r: 34 * scale },
    { dx: 16 * scale, dy: 9 * scale, r: 28 * scale },
  ]
  for (const { dx, dy, r } of offsets) {
    const gradient = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
    if (isUser) {
      gradient.addColorStop(0, 'rgba(255, 235, 59, 0)')
      gradient.addColorStop(0.22, 'rgba(255, 213, 79, 0.78)')
      gradient.addColorStop(0.55, 'rgba(255, 152, 0, 0.42)')
      gradient.addColorStop(1, 'rgba(255, 111, 0, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(255, 253, 231, 0)')
      gradient.addColorStop(0.25, 'rgba(255, 249, 196, 0.42)')
      gradient.addColorStop(0.58, 'rgba(255, 235, 59, 0.26)')
      gradient.addColorStop(1, 'rgba(255, 193, 7, 0)')
    }
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}
