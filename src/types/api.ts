import type { EventCategory, EventStatus, PriceType } from './event'

/** /api/events 목록 아이템(지도 핀 + 카드에 필요한 최소 필드). */
export interface EventListItem {
  id: string
  title: string
  category: EventCategory
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  venueName: string | null
  address: string | null
  lat: number | null
  lng: number | null
  regionSido: string | null
  regionSigungu: string | null
  areaDetail: string | null
  priceType: PriceType
  thumbnailUrl: string | null
  bookingUrl: string | null
  tags: string[]
  /** p_lat/p_lng 가 주어졌을 때만 채워지는 거리(미터). */
  distanceM: number | null
}

export interface EventListResponse {
  items: EventListItem[]
  page: number
  pageSize: number
  total: number
}

/** /api/events/[id] 상세. */
export interface EventDetail {
  id: string
  title: string
  description: string | null
  category: EventCategory
  startDate: string
  endDate: string
  startTime: string | null
  endTime: string | null
  venueName: string | null
  address: string | null
  roadAddress: string | null
  lat: number | null
  lng: number | null
  regionSido: string | null
  regionSigungu: string | null
  areaDetail: string | null
  priceType: PriceType
  priceMin: number | null
  priceMax: number | null
  bookingUrl: string | null
  homepageUrl: string | null
  thumbnailUrl: string | null
  images: string[]
  tags: string[]
  status: EventStatus
  sourceUrl: string | null
}
