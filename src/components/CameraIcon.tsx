import './CameraIcon.css'

interface Props {
  large?: boolean
}

export function CameraIcon({ large = false }: Props) {
  return (
    <span className={`camera-icon ${large ? 'camera-icon--lg' : ''}`} aria-hidden="true">
      📷
    </span>
  )
}
