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

/** 地面ラインより少し上（お尻の高さ）に配置 */
export function positionAtButtHeight(groundY: number, x?: number): { x: number; y: number } {
  const buttOffset = 0.07 + Math.random() * 0.06
  return {
    x: x ?? 0.12 + Math.random() * 0.76,
    y: Math.max(0.48, Math.min(0.9, groundY - buttOffset)),
  }
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
