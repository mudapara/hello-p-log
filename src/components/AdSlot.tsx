import './AdSlot.css'

interface Props {
  slot: 'top' | 'sidebar' | 'footer'
  label?: string
}

/** 広告枠プレースホルダー（AdSense等を後から差し替え可能） */
export function AdSlot({ slot, label = '広告' }: Props) {
  return (
    <aside className={`ad-slot ad-slot-${slot}`} aria-label="広告">
      <span className="ad-label">{label}</span>
      <div className="ad-placeholder">
        <p>広告枠</p>
        <small>ここに広告を表示できます</small>
      </div>
    </aside>
  )
}
