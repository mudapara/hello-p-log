import type { FartLog } from '../types'
import {
  APP_NAME,
  SITE_URL,
  TACTICS,
  formatBustedCount,
  formatFartLocation,
  formatSmellStrength,
  formatSmellType,
} from './constants'
import { formatPlaceLabel } from './geocode'
import { formatDateTime } from './geo'
import { getMethaneLevel } from './methaneConcentration'
import { shareOrDownloadImage } from './shareImage'

const CARD_WIDTH = 1080

function truncate(text: string, max: number): string {
  return text.length > max ? `${text.slice(0, max)}…` : text
}

export function buildLogPostShareText(placeLabel: string): string {
  return `Hello屁ログで${placeLabel}にログを残しました！\n世界地図を真っ黄色にしよう🟡\n${SITE_URL}`
}

export async function renderLogShareImage(log: FartLog): Promise<Blob> {
  const placeLabel = formatPlaceLabel(log)
  const methane = getMethaneLevel(log)
  const smell = formatSmellType(log.smellType, log.smellTypeOther)
  const smellStrength = formatSmellStrength(log.smellIntensity, log.smellIntensityOther)
  const busted = formatBustedCount(log.bustedCount, log.bustedOther)
  const fartPlace = formatFartLocation(log.fartLocation, log.fartLocationOther)
  const tactics = log.tactics
    .map((id) => (id === 'other' ? (log.tacticsOther ?? TACTICS.other.label) : TACTICS[id].label))
    .join(' / ')

  const lines = [
    { label: '場所', value: placeLabel },
    { label: 'ニックネーム', value: log.nickname },
    { label: '主成分', value: log.mainComponent },
    { label: '匂い', value: `${smell}（${smellStrength}）` },
    { label: '音', value: log.soundText },
    { label: 'バレ度', value: busted },
    { label: '放屁場所', value: fartPlace },
    { label: 'メタンレベル', value: methane },
    ...(tactics ? [{ label: '戦術', value: tactics }] : []),
    { label: '日時', value: formatDateTime(log.loggedAt) },
  ]

  const headerH = 72
  const rowH = 58
  const footerH = 52
  const totalH = headerH + 24 + lines.length * rowH + footerH

  const canvas = document.createElement('canvas')
  canvas.width = CARD_WIDTH
  canvas.height = totalH
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas not supported')

  const gradient = ctx.createLinearGradient(0, 0, 0, totalH)
  gradient.addColorStop(0, '#fffde7')
  gradient.addColorStop(1, '#fff9c4')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, CARD_WIDTH, totalH)

  ctx.fillStyle = '#f57f17'
  ctx.font = 'bold 34px "Segoe UI", Meiryo, sans-serif'
  ctx.fillText(`${APP_NAME} — ログ投稿`, 32, 46)

  let y = headerH + 8
  for (const line of lines) {
    ctx.fillStyle = '#8d6e63'
    ctx.font = 'bold 20px "Segoe UI", Meiryo, sans-serif'
    ctx.fillText(line.label, 32, y + 22)

    ctx.fillStyle = '#3e2723'
    ctx.font = '24px "Segoe UI", Meiryo, sans-serif'
    ctx.fillText(truncate(line.value, 28), 220, y + 24)

    ctx.strokeStyle = 'rgba(255, 193, 7, 0.35)'
    ctx.beginPath()
    ctx.moveTo(32, y + 44)
    ctx.lineTo(CARD_WIDTH - 32, y + 44)
    ctx.stroke()

    y += rowH
  }

  ctx.fillStyle = '#e65100'
  ctx.font = '18px "Segoe UI", Meiryo, sans-serif'
  ctx.fillText(SITE_URL.replace('https://', ''), 32, totalH - 18)

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('画像の生成に失敗しました'))),
      'image/jpeg',
      0.92,
    )
  })
}

export async function shareLogPost(log: FartLog): Promise<'shared' | 'downloaded' | 'copied'> {
  const placeLabel = formatPlaceLabel(log)
  const text = buildLogPostShareText(placeLabel)
  const blob = await renderLogShareImage(log)
  const filename = `hello-p-log-${log.id.slice(0, 8)}.jpg`

  const file = new File([blob], filename, { type: 'image/jpeg' })
  if (navigator.share && navigator.canShare?.({ files: [file] })) {
    try {
      await navigator.share({
        files: [file],
        title: APP_NAME,
        text,
        url: SITE_URL,
      })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e
    }
  }

  const downloaded = await shareOrDownloadImage(blob, filename)
  if (downloaded === 'downloaded') return 'downloaded'

  await navigator.clipboard.writeText(text)
  return 'copied'
}
