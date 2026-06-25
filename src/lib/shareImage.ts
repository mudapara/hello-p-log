import type { PhotoOverlayLog } from '../types'
import { APP_NAME, SITE_URL } from './constants'
import { getMethaneLevel } from './methaneConcentration'

export const SHARE_MESSAGE = `この場所に漂う屁ログを検出しました！！\n${SITE_URL}`

const SHARE_WIDTH = 1080

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

function drawMist(ctx: CanvasRenderingContext2D, x: number, y: number, isUser: boolean) {
  const scale = isUser ? 1.15 : 0.88
  const offsets = [
    { dx: 0, dy: 0, r: 44 * scale },
    { dx: -16, dy: -10, r: 30 * scale },
    { dx: 14, dy: 8, r: 26 * scale },
  ]
  for (const { dx, dy, r } of offsets) {
    const gradient = ctx.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r)
    if (isUser) {
      gradient.addColorStop(0, 'rgba(255, 213, 79, 0.92)')
      gradient.addColorStop(0.45, 'rgba(255, 152, 0, 0.62)')
      gradient.addColorStop(1, 'rgba(255, 111, 0, 0)')
    } else {
      gradient.addColorStop(0, 'rgba(255, 245, 157, 0.82)')
      gradient.addColorStop(0.45, 'rgba(255, 235, 59, 0.48)')
      gradient.addColorStop(1, 'rgba(255, 193, 7, 0)')
    }
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x + dx, y + dy, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

function drawLogCard(
  ctx: CanvasRenderingContext2D,
  log: PhotoOverlayLog,
  x: number,
  y: number,
  w: number,
) {
  const h = 82
  const isUser = log.source === 'user'

  ctx.fillStyle = isUser ? '#fff9c4' : '#fffde7'
  ctx.beginPath()
  ctx.roundRect(x, y, w, h, 10)
  ctx.fill()
  ctx.strokeStyle = isUser ? '#ffc107' : '#ffe082'
  ctx.lineWidth = isUser ? 3 : 2
  ctx.stroke()

  ctx.fillStyle = isUser ? '#ffc107' : '#fff176'
  ctx.beginPath()
  ctx.arc(x + 22, y + h / 2, isUser ? 10 : 8, 0, Math.PI * 2)
  ctx.fill()
  if (isUser) {
    ctx.fillStyle = '#fffde7'
    ctx.beginPath()
    ctx.arc(x + 18, y + h / 2 - 6, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  ctx.fillStyle = '#3e2723'
  ctx.font = 'bold 22px "Segoe UI", Meiryo, sans-serif'
  ctx.fillText(log.nickname, x + 42, y + 30)

  ctx.font = '17px "Segoe UI", Meiryo, sans-serif'
  ctx.fillStyle = '#5d4037'
  const methane = getMethaneLevel(log)
  ctx.fillText(`主成分: ${truncate(log.mainComponent, 14)}`, x + 42, y + 54)
  ctx.fillText(`メタンレベル ${methane} ｜ 音: ${truncate(log.soundText, 16)}`, x + 42, y + 74)
}

/** SNS用：写真＋全ログ詳細を1枚の画像に合成 */
export async function renderShareImage(photoUrl: string, logs: PhotoOverlayLog[]): Promise<Blob> {
  const img = await loadImage(photoUrl)
  const photoScale = SHARE_WIDTH / img.width
  const photoH = Math.round(img.height * photoScale)

  const headerH = 64
  const sectionTitleH = 48
  const displayLogs = logs.slice(0, 5)
  const extraCount = logs.length - displayLogs.length
  const cardH = 82
  const cardGap = 10
  const listH = displayLogs.length * (cardH + cardGap) + (extraCount > 0 ? 36 : 0)
  const footerH = 52
  const totalH = headerH + photoH + sectionTitleH + listH + footerH

  const canvas = document.createElement('canvas')
  canvas.width = SHARE_WIDTH
  canvas.height = totalH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  ctx.fillStyle = '#fff8e1'
  ctx.fillRect(0, 0, SHARE_WIDTH, totalH)

  ctx.fillStyle = '#f57f17'
  ctx.font = 'bold 34px "Segoe UI", Meiryo, sans-serif'
  ctx.fillText(`${APP_NAME} — 鑑識結果`, 28, 42)

  ctx.drawImage(img, 0, headerH, SHARE_WIDTH, photoH)
  for (const log of logs) {
    drawMist(
      ctx,
      log.overlayX * SHARE_WIDTH,
      headerH + log.overlayY * photoH,
      log.source === 'user',
    )
  }

  let y = headerH + photoH + 36
  ctx.fillStyle = '#4e342e'
  ctx.font = 'bold 26px "Segoe UI", Meiryo, sans-serif'
  ctx.fillText(`検出ログ ${logs.length}件`, 28, y)
  y += 28

  const cardW = SHARE_WIDTH - 56
  for (const log of displayLogs) {
    drawLogCard(ctx, log, 28, y, cardW)
    y += cardH + cardGap
  }

  if (extraCount > 0) {
    ctx.fillStyle = '#8d6e63'
    ctx.font = '20px "Segoe UI", Meiryo, sans-serif'
    ctx.fillText(`…ほか ${extraCount}件`, 28, y + 24)
  }

  ctx.fillStyle = '#e65100'
  ctx.font = '18px "Segoe UI", Meiryo, sans-serif'
  ctx.fillText(SITE_URL.replace('https://', ''), 28, totalH - 20)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画像の生成に失敗しました'))),
      'image/jpeg',
      0.92,
    )
  })
}

export async function shareOrDownloadImage(blob: Blob, filename: string): Promise<'shared' | 'downloaded'> {
  const file = new File([blob], filename, { type: 'image/jpeg' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      files: [file],
      title: APP_NAME,
      text: SHARE_MESSAGE,
      url: SITE_URL,
    })
    return 'shared'
  }

  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
  return 'downloaded'
}
