import { getMistStyleClass } from '../lib/profileStore'
import { MIST_STYLES, type MistStyleId } from '../lib/titles'
import './MistPreview.css'
import './PhotoCanvas.css'

interface Props {
  style: MistStyleId
}

export function MistPreview({ style }: Props) {
  const premium = getMistStyleClass(style)
  const meta = MIST_STYLES[style]

  return (
    <div className="mist-preview" aria-label={`現在のモヤ: ${meta.name}`}>
      <div className={`mist-marker mist-user mist-preview-marker ${premium}`}>
        <span className="mist-blob mist-blob-1" />
        <span className="mist-blob mist-blob-2" />
        <span className="mist-blob mist-blob-3" />
        <span className="mist-spark mist-spark-1" />
        <span className="mist-spark mist-spark-2" />
        <span className="mist-spark mist-spark-3" />
      </div>
      <p className="mist-preview-name">{meta.name}</p>
      <p className="mist-preview-desc">{meta.description}</p>
    </div>
  )
}
