/**
 * 写真から地面ラインを推定し、お尻の高さ付近にログを配置する
 */

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

/** 画像下端付近の明るさから地面のY座標（0=上, 1=下）を推定 */
export async function detectGroundLineY(imageSrc: string): Promise<number> {
  const img = await loadImage(imageSrc)
  const w = Math.min(img.width, 400)
  const h = Math.floor(img.height * (w / img.width))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) return 0.88

  ctx.drawImage(img, 0, 0, w, h)
  const { data } = ctx.getImageData(0, 0, w, h)

  const rowBrightness: number[] = []
  for (let y = 0; y < h; y++) {
    let sum = 0
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      sum += (data[i]! + data[i + 1]! + data[i + 2]!) / 3
    }
    rowBrightness.push(sum / w)
  }

  const bottomStart = Math.floor(h * 0.82)
  const bottomSlice = rowBrightness.slice(bottomStart)
  const bottomAvg =
    bottomSlice.reduce((a, b) => a + b, 0) / Math.max(1, bottomSlice.length)

  let groundRow = h - 2
  for (let y = Math.floor(h * 0.5); y < h - 1; y++) {
    if (Math.abs(rowBrightness[y]! - bottomAvg) < 22) {
      groundRow = y
      break
    }
  }

  return groundRow / h
}

export type PhotoScene = 'outdoor' | 'indoor' | 'unknown'

function analyzeImagePixels(imageSrc: string): Promise<ImageData> {
  return loadImage(imageSrc).then((img) => {
    const w = Math.min(img.width, 320)
    const h = Math.floor(img.height * (w / img.width))
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d')
    if (!ctx) throw new Error('canvas unavailable')
    ctx.drawImage(img, 0, 0, w, h)
    return ctx.getImageData(0, 0, w, h)
  })
}

/** 写真が屋外か室内かを簡易推定（空・緑・壁色などから判定） */
export async function detectPhotoScene(imageSrc: string): Promise<PhotoScene> {
  try {
    const { data, width: w, height: h } = await analyzeImagePixels(imageSrc)
    let skyHits = 0
    let skySamples = 0
    let greenHits = 0
    let greenSamples = 0
    let warmWallHits = 0
    let indoorSamples = 0

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4
        const r = data[i]!
        const g = data[i + 1]!
        const b = data[i + 2]!
        const yNorm = y / h

        if (yNorm < 0.35) {
          skySamples++
          if (b > r + 18 && b > g + 8 && b > 95) skyHits++
        }

        if (yNorm > 0.45) {
          greenSamples++
          if (g > r + 12 && g > b + 8 && g > 70) greenHits++
        }

        if (yNorm > 0.08 && yNorm < 0.92) {
          indoorSamples++
          const max = Math.max(r, g, b)
          const min = Math.min(r, g, b)
          const sat = max === 0 ? 0 : (max - min) / max
          if (sat < 0.22 && r > 95 && g > 85 && b > 75 && r >= g && g >= b - 15) {
            warmWallHits++
          }
        }
      }
    }

    const skyRatio = skyHits / Math.max(1, skySamples)
    const greenRatio = greenHits / Math.max(1, greenSamples)
    const wallRatio = warmWallHits / Math.max(1, indoorSamples)

    if (skyRatio > 0.06 || greenRatio > 0.1) return 'outdoor'
    if (wallRatio > 0.35 && skyRatio < 0.02 && greenRatio < 0.04) return 'indoor'
    if (skyRatio < 0.015 && greenRatio < 0.03) return 'indoor'
    return 'unknown'
  } catch {
    return 'unknown'
  }
}

/** 地面ラインより少し上（お尻の高さ）に配置 */
export function positionAtButtHeight(groundY: number, x?: number): { x: number; y: number } {
  const buttOffset = 0.07 + Math.random() * 0.06
  return {
    x: x ?? 0.12 + Math.random() * 0.76,
    y: Math.max(0.48, Math.min(0.9, groundY - buttOffset)),
  }
}

/** 写真上のログが重ならないよう、複数行に分散配置 */
export function spreadPhotoOverlays<T extends { overlayX: number; overlayY: number; source: string; photoTapX?: number | null }>(
  logs: T[],
  groundY: number,
): T[] {
  if (logs.length === 0) return []

  const sorted = [...logs].sort((a, b) => {
    if (a.source !== b.source) return a.source === 'user' ? -1 : 1
    return a.overlayX - b.overlayX
  })

  const yBase = Math.max(0.42, Math.min(0.82, groundY - 0.1))
  const rowCount = sorted.length <= 3 ? 1 : sorted.length <= 6 ? 2 : 3
  const minGapX = 0.17

  const placed = sorted.map((log, i) => {
    if (log.source === 'user' && log.photoTapX != null) {
      const row = i % rowCount
      return {
        ...log,
        overlayX: log.photoTapX,
        overlayY: Math.max(0.38, yBase - row * 0.11 - (i % 3) * 0.04),
      }
    }

    const row = Math.floor(i / Math.ceil(sorted.length / rowCount))
    const colInRow = i % Math.ceil(sorted.length / rowCount)
    const colsThisRow = Math.min(
      Math.ceil(sorted.length / rowCount),
      sorted.length - row * Math.ceil(sorted.length / rowCount),
    )
    const x = 0.1 + ((colInRow + 0.5) / Math.max(1, colsThisRow)) * 0.8
    const y = yBase - row * 0.12 - (colInRow % 2) * 0.05 - (i % 3) * 0.025

    return { ...log, overlayX: x, overlayY: Math.max(0.35, y) }
  })

  placed.sort((a, b) => a.overlayX - b.overlayX)
  for (let i = 1; i < placed.length; i++) {
    const prev = placed[i - 1]!
    const cur = placed[i]!
    if (Math.abs(cur.overlayY - prev.overlayY) < 0.06 && cur.overlayX - prev.overlayX < minGapX) {
      placed[i] = { ...cur, overlayX: prev.overlayX + minGapX }
    }
  }

  const maxX = 0.9
  const overflow = placed[placed.length - 1]!.overlayX - maxX
  if (overflow > 0) {
    for (let i = 0; i < placed.length; i++) {
      placed[i] = {
        ...placed[i]!,
        overlayX: Math.max(0.1, placed[i]!.overlayX - overflow),
      }
    }
  }

  return placed
}

export function clampTapToButtHeight(
  tapX: number,
  tapY: number,
  groundY: number,
): { x: number; y: number } {
  const maxY = Math.min(0.9, groundY - 0.04)
  const minY = Math.max(0.48, groundY - 0.18)
  return {
    x: tapX,
    y: Math.max(minY, Math.min(maxY, tapY)),
  }
}
