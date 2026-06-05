'use client'

import { useEffect } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import Link from 'next/link'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { EventListItem } from '@/types/api'
import { CATEGORY_LABEL, formatDateRange } from '@/lib/format'

function pinIcon(color: string) {
  return L.divIcon({
    className: '',
    html: `<span style="display:block;width:18px;height:18px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  })
}

// 시작일이 오늘에 가까울수록 밝게(명도↑), 멀수록 어둡게(명도↓). 진행 중이면 가장 밝음.
function proximityColor(startDate: string): string {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const start = new Date(`${startDate}T00:00:00`)
  const days = Math.max(0, Math.round((start.getTime() - today.getTime()) / 86400000))
  const t = 1 - Math.min(days, 30) / 30 // 가까울수록 1, 30일 이상이면 0
  const lightness = Math.round(32 + t * 28) // 32%(먼)~60%(가까운)
  return `hsl(14, 88%, ${lightness}%)`
}

export default function MapView({ events }: { events: EventListItem[] }) {
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
          icon={pinIcon(proximityColor(e.startDate))}
        >
          <Popup>
            <div className="text-sm">
              <div className="font-medium">{e.title}</div>
              <div className="text-zinc-500">
                {CATEGORY_LABEL[e.category]} · {formatDateRange(e.startDate, e.endDate)}
              </div>
              {e.venueName && <div className="text-zinc-500">{e.venueName}</div>}
              <Link
                href={`/events/${e.id}`}
                className="mt-1 inline-block font-medium text-indigo-600 underline"
              >
                상세 보기 →
              </Link>
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
