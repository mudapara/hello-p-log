import { MapContainer, TileLayer, CircleMarker, Popup, useMap } from 'react-leaflet'
import { useEffect } from 'react'
import type { FartLog } from '../types'
import { JAPAN_BOUNDS } from '../lib/constants'
import { formatDateTime } from '../lib/geo'
import './JapanMap.css'

interface Props {
  logs: FartLog[]
  filter: 'all' | 'ai' | 'user'
  onSelectLog?: (log: FartLog) => void
  height?: string
  interactive?: boolean
  center?: [number, number]
  zoom?: number
}

function FitJapanBounds() {
  const map = useMap()
  useEffect(() => {
    map.fitBounds([
      [JAPAN_BOUNDS.south, JAPAN_BOUNDS.west],
      [JAPAN_BOUNDS.north, JAPAN_BOUNDS.east],
    ])
  }, [map])
  return null
}

export function JapanMap({
  logs,
  filter,
  onSelectLog,
  height = '420px',
  interactive = true,
  center,
  zoom = 5,
}: Props) {
  const filtered = logs.filter((log) => {
    if (filter === 'all') return true
    return log.source === filter
  })

  const defaultCenter: [number, number] = center ?? [36.5, 138.0]

  return (
    <div className="japan-map" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={zoom}
        scrollWheelZoom={interactive}
        dragging={interactive}
        doubleClickZoom={interactive}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {!center && <FitJapanBounds />}
        {filtered.map((log) => (
          <CircleMarker
            key={log.id}
            center={[log.latitude, log.longitude]}
            radius={log.source === 'user' ? 7 : 5}
            pathOptions={{
              color: log.source === 'user' ? '#ff8f00' : '#fdd835',
              fillColor: log.source === 'user' ? '#ffca28' : '#fff176',
              fillOpacity: 0.9,
              weight: log.source === 'user' ? 2 : 1,
            }}
            eventHandlers={{
              click: () => onSelectLog?.(log),
            }}
          >
            <Popup>
              <div className="map-popup">
                <strong>{log.nickname}</strong>
                <span className={`badge-sm badge-${log.source}`}>
                  {log.source === 'ai' ? 'AI' : '現地'}
                </span>
                <p>{log.mainComponent}</p>
                <small>{formatDateTime(log.loggedAt)}</small>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
