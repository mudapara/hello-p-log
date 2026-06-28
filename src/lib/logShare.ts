import { APP_NAME, SITE_URL } from './constants'
import { getPrefectureFromCoords } from './prefectures'

/** 投稿地点の表示名（都道府県のみ） */
export function getPlaceLabelFromCoords(lat: number, lng: number): string {
  return getPrefectureFromCoords(lat, lng)
}

export function buildLogPostShareText(placeLabel: string): string {
  return `Hello屁ログで${placeLabel}にログを残しました！\n世界地図を真っ黄色にしよう🟡\n${SITE_URL}`
}

export async function shareLogPost(placeLabel: string): Promise<'shared' | 'copied'> {
  const text = buildLogPostShareText(placeLabel)

  if (navigator.share) {
    try {
      await navigator.share({
        title: APP_NAME,
        text,
        url: SITE_URL,
      })
      return 'shared'
    } catch (e) {
      if (e instanceof Error && e.name === 'AbortError') throw e
    }
  }

  await navigator.clipboard.writeText(text)
  return 'copied'
}
