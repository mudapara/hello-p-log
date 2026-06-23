import './MistIcon.css'

interface Props {
  large?: boolean
}

export function MistIcon({ large = false }: Props) {
  return (
    <span className={`mist-icon ${large ? 'mist-icon--lg' : ''}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  )
}
