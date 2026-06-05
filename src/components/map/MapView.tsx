'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EventListItem } from '@/types/api'
import { CATEGORY_COLOR, CATEGORY_LABEL, formatDateRange } from '@/lib/format'

// 카테고리 색상 원형 마커(기본 마커 이미지 깨짐 회피용 divIcon)
function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

export default function MapView({
  events,
  onSelect,
}: {
  events: EventListItem[]
  onSelect?: (event: EventListItem) => void
}) {
  const pinned = events.filter(
    (e): e is EventListItem & { lat: number; lng: number } =>
      e.lat != null && e.lng != null,
  )

  return (
    <MapContainer
      center={[36.5, 127.8]}
      zoom={7}
      className="h-full w-full"
      scrollWheelZoom
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds points={pinned.map((e) => [e.lat, e.lng] as [number, number])} />
      {pinned.map((e) => (
        <Marker
          key={e.id}
          position={[e.lat, e.lng]}
          icon={pinIcon(CATEGORY_COLOR[e.category])}
          eventHandlers={{ click: () => onSelect?.(e) }}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-medium">{e.title}</div>
              <div className="text-zinc-500">
                {CATEGORY_LABEL[e.category]} · {formatDateRange(e.startDate, e.endDate)}
              </div>
              {e.venueName && <div className="text-zinc-500">{e.venueName}</div>}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}

// 핀들이 모두 보이도록 지도 범위를 맞춘다(좌표 시그니처가 바뀔 때만).
function FitBounds({ points }: { points: [number, number][] }) {
  const map = useMap()
  const sig = points.map((p) => p.join(',')).join(';')

  useEffect(() => {
    if (points.length > 0) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 13 })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sig, map])

  return null
}
