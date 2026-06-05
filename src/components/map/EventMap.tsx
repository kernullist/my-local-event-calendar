'use client'

import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

export default function EventMap({
  lat,
  lng,
  color,
  title,
}: {
  lat: number
  lng: number
  color: string
  title: string
}) {
  const icon = L.divIcon({
    className: '',
    html: `<span style="display:block;width:20px;height:20px;border-radius:50%;background:${color};border:2px solid white;box-shadow:0 0 0 1px rgba(0,0,0,.35)"></span>`,
    iconSize: [20, 20],
    iconAnchor: [10, 10],
  })

  return (
    <MapContainer
      center={[lat, lng]}
      zoom={15}
      className="h-full w-full"
      scrollWheelZoom={false}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Marker position={[lat, lng]} icon={icon} title={title} />
    </MapContainer>
  )
}
