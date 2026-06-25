import { useMemo, useEffect } from 'react'
import { MapContainer, TileLayer, CircleMarker, Popup, Marker, useMap } from 'react-leaflet'
import L from 'leaflet'
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
  userMistStyles?: Map<string, string>
}

function makeUserMarkerIcon(mistStyle?: string) {
  const premium =
    mistStyle === 'royal'
      ? 'map-marker-royal'
      : mistStyle === 'toxic'
        ? 'map-marker-toxic'
        : mistStyle === 'rainbow'
          ? 'map-marker-rainbow'
          : mistStyle === 'ghost'
            ? 'map-marker-ghost'
            : mistStyle === 'ember'
              ? 'map-marker-ember'
              : mistStyle === 'void'
                ? 'map-marker-void'
                : mistStyle === 'storm'
                  ? 'map-marker-storm'
                  : mistStyle === 'neon'
                    ? 'map-marker-neon'
                    : ''
  return L.divIcon({
    className: 'map-log-marker-shell',
    html: `
    <div class="map-log-marker map-log-marker-user ${premium}" aria-hidden="true">
      <span class="map-log-glow"></span>
      <span class="map-log-core"></span>
      <span class="map-log-spark map-log-spark-1"></span>
      <span class="map-log-spark map-log-spark-2"></span>
      <span class="map-log-spark map-log-spark-3"></span>
    </div>
  `,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  })
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

function LogPopup({ log }: { log: FartLog }) {
  return (
    <Popup>
      <div className="map-popup">
        <strong>{log.nickname}</strong>
        <span className={`badge-sm badge-${log.source}`}>
          {log.source === 'ai' ? 'AI' : 'ユーザー'}
        </span>
        <p>{log.mainComponent}</p>
        <small>{formatDateTime(log.loggedAt)}</small>
      </div>
    </Popup>
  )
}

export function JapanMap({
  logs,
  filter,
  onSelectLog,
  height = '420px',
  interactive = true,
  center,
  zoom = 5,
  userMistStyles,
}: Props) {
  const filtered = useMemo(
    () =>
      logs.filter((log) => {
        if (filter === 'all') return true
        return log.source === filter
      }),
    [logs, filter],
  )

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
        {filtered.map((log) =>
          log.source === 'user' ? (
            <Marker
              key={log.id}
              position={[log.latitude, log.longitude]}
              icon={makeUserMarkerIcon(
                log.userId ? userMistStyles?.get(log.userId) : undefined,
              )}
              eventHandlers={{
                click: () => onSelectLog?.(log),
              }}
            >
              <LogPopup log={log} />
            </Marker>
          ) : (
            <CircleMarker
              key={log.id}
              center={[log.latitude, log.longitude]}
              radius={5}
              pathOptions={{
                color: '#fdd835',
                fillColor: '#fff176',
                fillOpacity: 0.88,
                weight: 1,
              }}
              eventHandlers={{
                click: () => onSelectLog?.(log),
              }}
            >
              <LogPopup log={log} />
            </CircleMarker>
          ),
        )}
      </MapContainer>
    </div>
  )
}
