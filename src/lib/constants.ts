import type { TacticId } from '../types'

export const APP_NAME = 'Hello屁ログ'
export const TAGLINE = 'おならの痕跡を、地図に残すサイト'

/** 使い方セクションへのアンカー（フッター・投稿フォームから） */
export const ABOUT_USAGE_SECTION_ID = 'usage'
export const ABOUT_USAGE_URL = `/about#${ABOUT_USAGE_SECTION_ID}`

/** 写真を選んで黄色いログを載せる機能 */
export const FEATURE_PHOTO = {
  nav: '写真アナライズ',
  title: '写真アナライズ',
  desc: '写真を選ぶと黄色いログが浮かぶ。タップでメタン情報。',
  resultHeading: 'アナライズ結果',
} as const

/** カメラ映像の上に黄色いモヤを出す機能 */
export const FEATURE_AR = {
  nav: 'ARログ検出',
  title: 'ARログ検出',
  desc: 'カメラを向けてタップ。映像の上に黄色いモヤが出る。',
} as const

/** 全国のログを地図表示 */
export const FEATURE_MAP = {
  nav: '全国マップ',
  title: '全国マップ',
  desc: '全国のログ分布。増えるほど黄色くなる。',
} as const

/** 地図に痕跡を残す投稿 */
export const FEATURE_LOG_POST = {
  nav: 'ログ投稿',
  title: 'ログ投稿',
  desc: '地図に痕跡を残す。写真は任意。',
} as const

export const SITE_URL =
  (import.meta.env.VITE_SITE_URL as string | undefined)?.replace(/\/$/, '') ||
  'https://hello-p-log.vercel.app'

/** ログイン後のリダイレクト先（本番は常に公開URL） */
export function getAuthRedirectUrl(path = '/my-logs'): string {
  if (typeof window !== 'undefined') {
    const { origin, hostname } = window.location
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return `${origin}${path}`
    }
  }
  return `${SITE_URL}${path}`
}

/** AI生成用の食べ物サンプル（ユーザー入力は自由記載） */
export const AI_FOOD_SAMPLES = [
  '焼き芋', 'ビール', 'ラーメン', 'カレー', '納豆', '牛乳', 'サラダ', 'コンビニ弁当',
  'タピオカミルクティー', 'おでん', 'すき焼き', 'たこ焼き', '冷やした牛乳', 'キムチ',
]

export const SMELL_TYPES = [
  '卵が腐ったような匂い',
  '玉ねぎ・キャベツ系',
  '焼き芋っぽい甘い匂い',
  '古いチーズ系（熟成された感じ）',
  '生魚市場っぽい',
  '無臭（気配なし）',
  'なんか甘い',
  'スッキリしない微妙な匂い',
  '肉団子で漢方を作ったような匂い',
  '草原に寝転がり茶虹を見ているような匂い',
  '湿った雑誌の裏表紙の匂い',
  '電車の吊り革の匂い',
  '体育館のシューズボックス系',
  'コンビニの温かい肉まんの残り香',
  '正体不明のノスタルジー',
  '畳の部屋で豆乳飲んだ後の空気',
  'その他',
] as const

export const SMELL_TYPE_OTHER = 'その他' as const

export const SMELL_INTENSITY_OTHER = 0

export const SMELL_STRENGTH_OPTIONS = [
  { value: 1, label: '無臭' },
  { value: 2, label: '自分だけがわかる' },
  { value: 3, label: 'そこそこ臭い' },
  { value: 4, label: '激臭' },
  { value: 5, label: '今年一番' },
  { value: 6, label: 'ガスマスク必須' },
  { value: SMELL_INTENSITY_OTHER, label: 'その他（自由記述）' },
] as const

export function getSmellStrengthLabel(intensity: number): string {
  const found = SMELL_STRENGTH_OPTIONS.find((o) => o.value === intensity)
  return found?.label ?? `レベル${intensity}`
}

export function formatSmellType(
  type: string,
  other: string | null | undefined,
): string {
  if (type === SMELL_TYPE_OTHER) return other?.trim() || SMELL_TYPE_OTHER
  return type
}

export function formatSmellStrength(
  intensity: number,
  other: string | null | undefined,
): string {
  if (intensity === SMELL_INTENSITY_OTHER) return other?.trim() || 'その他'
  return getSmellStrengthLabel(intensity)
}

export const SOUND_PRESET_OTHER = 'custom_other'

export const BUSTED_COUNT_OTHER = -1

export function formatBustedCount(
  count: number,
  other: string | null | undefined,
): string {
  if (count === BUSTED_COUNT_OTHER) return other?.trim() || 'その他'
  return `${count}人`
}

/** ログ投稿時の放屁場所（公共の場 + 自宅 + その他） */
export const FART_LOCATION_OPTIONS = [
  '道路',
  '電車',
  'バス',
  '車',
  '新幹線',
  'エレベーター',
  '学校',
  '会社',
  'スーパー',
  'コンビニ',
  '駅',
  '病院',
  'レストラン・カフェ',
  '公園',
  'トイレ',
  '自宅',
  'その他',
] as const

export type FartLocationOption = (typeof FART_LOCATION_OPTIONS)[number]

export function formatFartLocation(
  location: string | null | undefined,
  other: string | null | undefined,
): string {
  if (!location) return '—'
  if (location === 'その他') return other?.trim() || 'その他'
  return location
}

export interface SoundOption {
  id: string
  category: 'すかし' | '小' | '中' | '大' | 'その他'
  label: string
  text: string
}

export const SOUND_OPTIONS: SoundOption[] = [
  // すかし（音をごまかした）
  { id: 'mask_cough', category: 'すかし', label: '咳払いに紛れた', text: '（咳払い）…プッ' },
  { id: 'mask_step', category: 'すかし', label: '足音に紛れた', text: '（足音ドン）…プ' },
  { id: 'mask_bag', category: 'すかし', label: 'カバンの音に紛れた', text: '（ジャリッ）…プ' },
  { id: 'mask_door', category: 'すかし', label: 'ドアの音に紛れた', text: '（バタン）…プ' },
  { id: 'mask_wind', category: 'すかし', label: '風音に紛れた', text: '（ヒュウ）…プ' },
  { id: 'mask_train', category: 'すかし', label: '電車の音に紛れた', text: '（ガタン）…プ' },
  { id: 'mask_phone', category: 'すかし', label: '着信音に紛れた', text: '（ピロロ）…プ' },
  { id: 'mask_stretch', category: 'すかし', label: '伸びに紛れた', text: '（ムキィ）…プ' },
  { id: 'mask_zip', category: 'すかし', label: 'ファスナーに紛れた', text: '（ジッ）…プ' },
  { id: 'mask_sneeze', category: 'すかし', label: 'くしゃみに紛れた', text: '（ハックション）…プ' },
  { id: 'mask_laugh', category: 'すかし', label: '笑い声に紛れた', text: '（ゲラゲラ）…プ' },
  { id: 'mask_silent', category: 'すかし', label: '完全消音（忍者）', text: '無音（消音成功）' },
  { id: 'mask_suu', category: 'すかし', label: 'スゥゥゥ…', text: 'スゥゥゥ…' },
  { id: 'mask_shipi', category: 'すかし', label: 'シピィィィ', text: 'シピィィィ' },
  { id: 'mask_chuu', category: 'すかし', label: 'チュウゥゥ…', text: 'チュウゥゥ…' },
  { id: 'mask_shu', category: 'すかし', label: 'シュゥゥ…', text: 'シュゥゥ…' },
  { id: 'mask_page', category: 'すかし', label: 'ページめくりに紛れた', text: '（パラパラ）…プ' },
  { id: 'mask_chair', category: 'すかし', label: '椅子のきしみに紛れた', text: '（ギィ）…プ' },
  // 小
  { id: 'small_pu', category: '小', label: 'プゥ…', text: 'プゥ…' },
  { id: 'small_pi', category: '小', label: 'ピッ', text: 'ピッ' },
  { id: 'small_po', category: '小', label: 'ポッ', text: 'ポッ' },
  { id: 'small_pe', category: '小', label: 'ペッ', text: 'ペッ' },
  { id: 'small_bu', category: '小', label: 'ブゥ…', text: 'ブゥ…' },
  { id: 'small_su', category: '小', label: 'スゥ…', text: 'スゥ…' },
  { id: 'small_chu', category: '小', label: 'チュッ', text: 'チュッ' },
  { id: 'small_kyu', category: '小', label: 'キュッ', text: 'キュッ' },
  { id: 'small_muu', category: '小', label: 'ムゥ…', text: 'ムゥ…' },
  { id: 'small_hu', category: '小', label: 'フゥ…', text: 'フゥ…' },
  { id: 'small_ton', category: '小', label: 'トン…', text: 'トン…' },
  { id: 'small_pon', category: '小', label: 'ポン…', text: 'ポン…' },
  { id: 'small_pii', category: '小', label: 'プィッ', text: 'プィッ' },
  { id: 'small_poo', category: '小', label: 'プォッ', text: 'プォッ' },
  { id: 'small_tsu', category: '小', label: 'ツッ', text: 'ツッ' },
  { id: 'small_ku', category: '小', label: 'クッ', text: 'クッ' },
  { id: 'small_shu', category: '小', label: 'シュッ', text: 'シュッ' },
  { id: 'small_fuu', category: '小', label: 'フゥゥ…', text: 'フゥゥ…' },
  { id: 'small_pipi', category: '小', label: 'ピピッ', text: 'ピピッ' },
  // 中
  { id: 'mid_bubu', category: '中', label: 'ブブブ…', text: 'ブブブ…' },
  { id: 'mid_brr', category: '中', label: 'ブルルル…', text: 'ブルルル…' },
  { id: 'mid_pan', category: '中', label: 'パンッ', text: 'パンッ' },
  { id: 'mid_don', category: '中', label: 'ドンッ', text: 'ドンッ' },
  { id: 'mid_bon', category: '中', label: 'ボンッ', text: 'ボンッ' },
  { id: 'mid_pupu', category: '中', label: 'プププ…', text: 'プププ…' },
  { id: 'mid_bibi', category: '中', label: 'ビビビ…', text: 'ビビビ…' },
  { id: 'mid_dododo', category: '中', label: 'ドドド…', text: 'ドドド…' },
  { id: 'mid_gogo', category: '中', label: 'ゴゴゴ…', text: 'ゴゴゴ…' },
  { id: 'mid_rumble', category: '中', label: 'ゴロゴロ…', text: 'ゴロゴロ…' },
  { id: 'mid_trumpet', category: '中', label: 'トランペット風', text: 'プーーー♪' },
  { id: 'mid_whistle', category: '中', label: 'ホイッスル風', text: 'ピィーー' },
  { id: 'mid_bupupu', category: '中', label: 'ブプププ…', text: 'ブプププ…' },
  { id: 'mid_pururu', category: '中', label: 'プルルル…', text: 'プルルル…' },
  { id: 'mid_duuun', category: '中', label: 'ドゥゥゥン', text: 'ドゥゥゥン' },
  { id: 'mid_zugogo', category: '中', label: 'ズゴゴゴ…', text: 'ズゴゴゴ…' },
  { id: 'mid_batabata', category: '中', label: 'バタバタン', text: 'バタバタン' },
  { id: 'mid_pipipi', category: '中', label: 'ピピピピ…', text: 'ピピピピ…' },
  { id: 'mid_bururu', category: '中', label: 'ブルルルル…', text: 'ブルルルル…' },
  // 大
  { id: 'large_ban', category: '大', label: 'バァァン！', text: 'バァァン！' },
  { id: 'large_don', category: '大', label: 'ドォォン！', text: 'ドォォン！' },
  { id: 'large_boom', category: '大', label: 'ドカーン！', text: 'ドカーン！' },
  { id: 'large_thunder', category: '大', label: '雷鳴級', text: 'ゴロォォン！！' },
  { id: 'large_horn', category: '大', label: 'クラクション級', text: 'プパァァァン！！' },
  { id: 'large_tuba', category: '大', label: 'チューバ級', text: 'ブォォォォン！！' },
  { id: 'large_jet', category: '大', label: 'ジェット噴射級', text: 'ビュォォォォン！！' },
  { id: 'large_earthquake', category: '大', label: '地震注意報級', text: 'ゴゴゴゴゴ！！' },
  { id: 'large_stadium', category: '大', label: 'スタジアム歓声級', text: 'ワァァァ！！（違う）' },
  { id: 'large_nuclear', category: '大', label: '取り扱い注意', text: '※計測不能' },
  { id: 'large_siren', category: '大', label: 'サイレン級', text: 'ピーポーピーポー（？）' },
  { id: 'large_cannon', category: '大', label: '大砲発射級', text: 'ドォォォン！！！' },
  { id: 'large_bubiba', category: '大', label: 'ブビビビッ級', text: 'ブビビビッブブババババ！！！！！' },
  { id: 'large_buroro', category: '大', label: 'ブロロロロン級', text: 'ブロロロロンバロロロロロロロン' },
  { id: 'large_dogaan', category: '大', label: 'ドガーン！！', text: 'ドガーン！！' },
  { id: 'large_bakyun', category: '大', label: 'バキュン！！', text: 'バキュン！！' },
  { id: 'large_byururu', category: '大', label: 'ビュルルルル！！', text: 'ビュルルルル！！' },
  { id: 'large_bong', category: '大', label: 'ブォンガッ！！', text: 'ブォンガッ！！' },
  { id: 'large_zudoon', category: '大', label: 'ズドォォン！！', text: 'ズドォォン！！' },
  { id: 'large_gyaa', category: '大', label: 'ギャァァァ！！', text: 'ギャァァァ！！' },
  { id: 'large_dodon', category: '大', label: 'ドドドドドン！！', text: 'ドドドドドン！！' },
  { id: SOUND_PRESET_OTHER, category: 'その他', label: 'その他（自由記述）', text: '' },
]

export const SOUND_CATEGORIES = ['すかし', '小', '中', '大', 'その他'] as const

export function getSoundOption(id: string): SoundOption | undefined {
  return SOUND_OPTIONS.find((s) => s.id === id)
}

export const TACTICS: Record<TacticId, { label: string; description: string }> = {
  rear_guard: {
    label: '後方警戒',
    description: '振り返って後ろに人がいないか確認する動き。おならがバレないか背後をチェックします。',
  },
  vortex: {
    label: '渦流拡散',
    description: 'S字歩行などで空気の渦を作り、匂いを周囲に薄める動き。',
  },
  sound_mask: {
    label: '音響遮断',
    description: '咳払いや足音などで、放出音をごまかす動き。',
  },
  blame_shift: {
    label: '他者転嫁',
    description: '「くさっ！誰だよ！」と周囲を睨み、自分を被害者側に置く動き。',
  },
  other: {
    label: 'その他（自由記述）',
    description: '上記以外のオリジナル戦術。',
  },
}

export const AI_NAMES_MALE = [
  'サトシ', 'ケンタ', 'タクヤ', 'リョウ', 'ジロウ', 'コウジ', 'ショウ', 'ダイスケ',
] as const

export const AI_NAMES_FEMALE = [
  'ユイ', 'ミサキ', 'アヤ', 'ハルカ', 'サクラ', 'ナナ', 'メイ',
] as const

export const AI_NAMES_NEUTRAL = [
  'アキラ', 'ハル', 'ユキ', 'ソラ',
] as const

/** @deprecated 性別連動の AI_NAMES_* を使用 */
export const AI_NAMES = [
  ...AI_NAMES_MALE,
  ...AI_NAMES_FEMALE,
  ...AI_NAMES_NEUTRAL,
]

export const AI_AGES = [
  '10代前半', '10代後半', '20代前半', '20代後半', '30代前半', '30代後半',
  '24歳', '27歳', '31歳', '19歳', '42歳', '16歳',
]

export const AI_GENDERS = ['男', '女', 'その他'] as const

export const ANIMALS = [
  'リス', 'スズメ', 'カラス', 'ネコ', 'イヌ', 'シカ', 'アライグマ', 'カブトムシ',
]

/** 放出速度（km/h）ごとの例え。各段階からランダムで1つ選ぶ */
export const RELEASE_SPEED_TIERS = [
  {
    maxKmh: 2,
    comparisons: ['よちよち歩き程度', 'カタツムリが焦っている速度', '砂時計の砂が1粒落ちる速さ'],
  },
  {
    maxKmh: 4,
    comparisons: [
      '人の普通の歩行と同程度（約4km/h）',
      '寝起きのウサインボルト',
      'エスカレーターに乗り遅れた人の後ろ追い',
    ],
  },
  {
    maxKmh: 6,
    comparisons: ['早歩き程度（約6km/h）', '理科室の水道から出る水', '給食のおかずを急ぐ列'],
  },
  {
    maxKmh: 8,
    comparisons: ['小走りする子ども程度', 'バス停にバスが見えた瞬間の親', '猫がカーペットで滑る速度'],
  },
  {
    maxKmh: 10,
    comparisons: [
      '自転車をゆっくり漕ぐ速度',
      '開けた炭酸ジュースの最初の泡',
      '校門閉鎖5分前の中学生',
    ],
  },
  {
    maxKmh: 12,
    comparisons: ['風船から空気が抜けるくらいの勢い', 'ドライヤー（弱）の風', 'エレベーターが閉まる直前の気配'],
  },
  {
    maxKmh: 15,
    comparisons: ['扇風機（強）の風速程度', '傘が裏返る直前の一瞬', '体育館の換気扇が気になってきた頃'],
  },
  {
    maxKmh: 99,
    comparisons: [
      'スケートボードで流している速度',
      '台風10号の目の前の落ち葉',
      '新幹線の窓に張り付いたハエの気持ち',
    ],
  },
] as const

/** 一覧表示・ドキュメント用の代表例 */
export const RELEASE_SPEED_REFERENCE = RELEASE_SPEED_TIERS.map((tier) => ({
  maxKmh: tier.maxKmh,
  comparison: tier.comparisons[0],
}))

export function getComparisonForSpeed(kmh: number): string {
  const tier = RELEASE_SPEED_TIERS.find((t) => kmh <= t.maxKmh)
  const pool = tier?.comparisons ?? RELEASE_SPEED_TIERS[RELEASE_SPEED_TIERS.length - 1]!.comparisons
  return pool[Math.floor(Math.random() * pool.length)]!
}

/** メタンレベルモーダル用の一言説明 */
export const METHANE_LEVEL_HINT = '1㎥の空気中に占めるメタンガスのレベル'

export const SOCIAL_IMPACTS_OUTDOOR = [
  '誰も気づかなかった（成功）',
  '後方の人が1歩距離を取った',
  '友人1名に白目をもらった',
  '周囲2m以内で会話が3秒停止',
  '隣の人が静かに移動した',
  '周囲の犬が鼻をひくひくさせた',
  '近くの家族が一瞬黙った',
  '周囲の人がペースを落とした',
  '遠くの鳥が飛び立った',
] as const

export const SOCIAL_IMPACTS_INDOOR = [
  '周囲の視線が集まった',
  '周囲の空気が一瞬変わった',
  '誰かがウィンドウを開けた',
  '後方でくすくす笑いが起きた',
  '周囲で一瞬の沈黙',
  '隣の席の人がそっと距離を取った',
  '誰も気づかなかった（成功）',
] as const

export const SOCIAL_IMPACTS = [
  ...SOCIAL_IMPACTS_OUTDOOR,
  ...SOCIAL_IMPACTS_INDOOR,
]

export const JAPAN_BOUNDS = {
  south: 24.0,
  north: 46.0,
  west: 122.0,
  east: 154.0,
}

export const MATCH_RADIUS_METERS = 80
