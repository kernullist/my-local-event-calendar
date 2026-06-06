export type SourceId = 'tourapi' | 'seoul' | 'culture'

export type EventCategory =
  | 'exhibition' // 전시
  | 'festival' // 축제
  | 'concert' // 콘서트
  | 'performance' // 연극·뮤지컬
  | 'popup' // 브랜드 팝업
  | 'academic' // 학술·네트워킹
  | 'etc' // 기타

export type PriceType = 'free' | 'paid' | 'unknown'

export type EventStatus = 'active' | 'ended' | 'cancelled'

/** 어댑터가 출처 원본을 변환한 결과(도메인 모델, camelCase). */
export interface NormalizedEvent {
  sourceId: SourceId
  externalId: string
  title: string
  description?: string | null
  category: EventCategory
  startDate: string // YYYY-MM-DD
  endDate: string // YYYY-MM-DD
  startTime?: string | null // HH:mm
  endTime?: string | null
  venueName?: string | null
  address?: string | null
  roadAddress?: string | null
  lat?: number | null
  lng?: number | null
  regionSido?: string | null
  regionSigungu?: string | null
  areaDetail?: string | null // 성수/홍대/강남 등
  priceType?: PriceType
  priceMin?: number | null
  priceMax?: number | null
  bookingUrl?: string | null
  homepageUrl?: string | null
  thumbnailUrl?: string | null
  images?: string[]
  tags?: string[]
  sourceUrl?: string | null
}

/** events 테이블 insert/upsert payload (snake_case, DB 컬럼과 1:1). */
export interface EventInsert {
  source_id: SourceId
  external_id: string
  title: string
  description: string | null
  category: EventCategory
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  venue_name: string | null
  address: string | null
  road_address: string | null
  location: string | null // PostGIS EWKT: 'SRID=4326;POINT(lng lat)'
  region_sido: string | null
  region_sigungu: string | null
  area_detail: string | null
  price_type: PriceType
  price_min: number | null
  price_max: number | null
  booking_url: string | null
  homepage_url: string | null
  thumbnail_url: string | null
  images: string[]
  tags: string[]
  source_url: string | null
  content_hash: string
}
