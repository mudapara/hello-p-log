import type { UserProfileStats } from '../types'

export type MistStyleId =
  | 'default'
  | 'royal'
  | 'toxic'
  | 'rainbow'
  | 'ghost'
  | 'ember'
  | 'void'
  | 'storm'
  | 'neon'

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
  ember: { name: '焔モヤ', description: '燃え盛るオレンジの炎のようなモヤ' },
  void: { name: '虚無モヤ', description: '吸い込まれそうな闇のモヤ' },
  storm: { name: '嵐モヤ', description: '渦を巻く紫黒い暴風のモヤ' },
  neon: { name: 'ネオンモヤ', description: '不気味に光る緑色のモヤ' },
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
    id: 'pilgrimage',
    name: '列島巡礼',
    description: '15の都道府県でログを残した',
    check: (s) => s.uniquePrefectures.length >= 15,
  },
  {
    id: 'nationwide',
    name: '全国制覇の屁',
    description: '10の都道府県でログを残した',
    check: (s) => s.uniquePrefectures.length >= 10,
  },
  {
    id: 'nationwide_20',
    name: '日本縦断',
    description: '20の都道府県でログを残した',
    mistUnlock: 'storm',
    check: (s) => s.uniquePrefectures.length >= 20,
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
    mistUnlock: 'void',
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
    mistUnlock: 'ember',
    check: (s) => s.totalLogs >= 20,
  },
  {
    id: 'prolific_30',
    name: '三十屁伝',
    description: '累計30件以上ログを残した',
    check: (s) => s.totalLogs >= 30,
  },
  {
    id: 'prolific_50',
    name: '屁の覇者',
    description: '累計50件以上ログを残した',
    check: (s) => s.totalLogs >= 50,
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
    mistUnlock: 'neon',
    check: (s) => s.photoLogs >= 15,
  },
  {
    id: 'photo_poet',
    name: '現場の詩人',
    description: '写真付きログを30件投稿した',
    check: (s) => s.photoLogs >= 30,
  },
  {
    id: 'silent_ghost',
    name: '消音の亡霊',
    description: '静かなログを7件投稿した',
    check: (s) => s.silentLogs >= 7,
  },
  {
    id: 'silent_ninja',
    name: '極限消音',
    description: '静かなログを12件投稿した',
    check: (s) => s.silentLogs >= 12,
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
  {
    id: 'methane_titan',
    name: 'メタン巨神',
    description: 'メタンポイント2000を超えた',
    check: (s) => s.methanePoints >= 2000,
  },
  {
    id: 'methane_god',
    name: 'メタン神',
    description: 'メタンポイント3000を超えた',
    check: (s) => s.methanePoints >= 3000,
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
