import type { UserProfileStats } from '../types'

export type MistStyleId = 'default' | 'royal' | 'toxic' | 'rainbow' | 'ghost'

export interface TitleDef {
  id: string
  name: string
  description: string
  mistUnlock?: MistStyleId
  check: (stats: UserProfileStats) => boolean
}

export const MIST_STYLES: Record<
  MistStyleId,
  { name: string; description: string }
> = {
  default: { name: '標準モヤ', description: 'いつもの黄色いモヤ' },
  royal: { name: '帝王モヤ', description: '金色に輝く特別なモヤ' },
  toxic: { name: '危険モヤ', description: '赤く脈打つ警告色のモヤ' },
  rainbow: { name: '魔境モヤ', description: '油膜のような不気味な虹色' },
  ghost: { name: '残像モヤ', description: '薄く漂う、消えかけのモヤ' },
}

export const TITLE_DEFS: TitleDef[] = [
  {
    id: 'first_log',
    name: '初屁',
    description: 'はじめてログを投稿した',
    check: (s) => s.totalLogs >= 1,
  },
  {
    id: 'silent_master',
    name: '無音の策士',
    description: '静かなログを3件投稿した',
    check: (s) => s.silentLogs >= 3,
  },
  {
    id: 'prefecture_hopper',
    name: '都道府県通',
    description: '3つの都道府県でログを残した',
    check: (s) => s.uniquePrefectures.length >= 3,
  },
  {
    id: 'explorer',
    name: '魔境開拓者',
    description: '5つの都道府県でログを残した',
    mistUnlock: 'rainbow',
    check: (s) => s.uniquePrefectures.length >= 5,
  },
  {
    id: 'nationwide',
    name: '全国制覇の屁',
    description: '10の都道府県でログを残した',
    check: (s) => s.uniquePrefectures.length >= 10,
  },
  {
    id: 'methane_apprentice',
    name: 'ガス職人',
    description: 'メタンレベル60以上を記録した',
    check: (s) => s.maxMethaneLevel >= 60,
  },
  {
    id: 'methane_king',
    name: 'メタン帝王',
    description: 'メタンレベル80以上を記録した',
    mistUnlock: 'royal',
    check: (s) => s.maxMethaneLevel >= 80,
  },
  {
    id: 'methane_legend',
    name: 'メタン伝説',
    description: 'メタンレベル95以上を記録した',
    check: (s) => s.maxMethaneLevel >= 95,
  },
  {
    id: 'danger_zone',
    name: '危険地帯の徒',
    description: '累計10件以上ログを残した',
    mistUnlock: 'toxic',
    check: (s) => s.totalLogs >= 10,
  },
  {
    id: 'prolific',
    name: '泛滥の屁王',
    description: '累計20件以上ログを残した',
    check: (s) => s.totalLogs >= 20,
  },
  {
    id: 'photo_pro',
    name: '現場写真家',
    description: '写真付きログを5件投稿した',
    mistUnlock: 'ghost',
    check: (s) => s.photoLogs >= 5,
  },
  {
    id: 'photo_master',
    name: '鑑識マニア',
    description: '写真付きログを15件投稿した',
    check: (s) => s.photoLogs >= 15,
  },
  {
    id: 'silent_ghost',
    name: '消音の亡霊',
    description: '静かなログを7件投稿した',
    check: (s) => s.silentLogs >= 7,
  },
  {
    id: 'veteran',
    name: '歴戦の屁王',
    description: 'メタンポイント500を超えた',
    check: (s) => s.methanePoints >= 500,
  },
  {
    id: 'point_tycoon',
    name: 'メタン財閥',
    description: 'メタンポイント1000を超えた',
    check: (s) => s.methanePoints >= 1000,
  },
]

export function computeUnlockedTitles(stats: UserProfileStats): string[] {
  return TITLE_DEFS.filter((t) => t.check(stats)).map((t) => t.id)
}

export function computeUnlockedMistStyles(unlockedTitleIds: string[]): MistStyleId[] {
  const styles = new Set<MistStyleId>(['default'])
  for (const title of TITLE_DEFS) {
    if (title.mistUnlock && unlockedTitleIds.includes(title.id)) {
      styles.add(title.mistUnlock)
    }
  }
  return [...styles]
}

export function getTitleById(id: string): TitleDef | undefined {
  return TITLE_DEFS.find((t) => t.id === id)
}
