import './CameraIcon.css'

interface Props {
  large?: boolean
}

export function CameraIcon({ large = false }: Props) {
  return (
    <span className={`camera-icon ${large ? 'camera-icon--lg' : ''}`} aria-hidden="true">
      <span className="camera-icon-body">
        <span className="camera-icon-top" />
        <span className="camera-icon-lens" />
        <span className="camera-icon-flash" />
      </span>
    </span>
  )
}
