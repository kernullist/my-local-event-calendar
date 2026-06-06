import { z } from 'zod'
import type { EventCategory, EventStatus, PriceType } from '@/types/event'
import type { EventDetail, EventListItem } from '@/types/api'

const CATEGORY_VALUES: readonly EventCategory[] = [
  'exhibition', 'festival', 'concert', 'performance', 'popup', 'academic', 'etc',
]

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/

/** /api/events 쿼리스트링 검증·변환 스키마. */
export const EventQuerySchema = z.object({
  from: z.string().regex(DATE_RE).optional(), // 기간 시작(YYYY-MM-DD)
  to: z.string().regex(DATE_RE).optional(), // 기간 끝
  category: z.string().optional(), // "festival,popup" (콤마 구분)
  sido: z.string().optional(),
  sigungu: z.string().optional(),
  area: z.string().optional(),
  price: z.enum(['free']).optional(), // 무료만 보기
  tags: z.string().optional(), // 콤마 구분(동반자/주제 등)
  q: z.string().optional(), // 제목 검색
  lat: z.coerce.number().min(-90).max(90).optional(),
  lng: z.coerce.number().min(-180).max(180).optional(),
  radius: z.coerce.number().int().positive().max(50000).optional(), // meters
  sort: z.enum(['date', 'distance']).default('date'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(1000).default(50),
})
export type EventQuery = z.infer<typeof EventQuerySchema>

/** 검증된 쿼리 → search_events RPC 파라미터. */
export function toRpcParams(q: EventQuery) {
  const categories = q.category
    ? q.category.split(',').map((s) => s.trim()).filter(isCategory)
    : null
  const tags = q.tags ? q.tags.split(',').map((s) => s.trim()).filter(Boolean) : null

  return {
    p_from: q.from ?? null,
    p_to: q.to ?? null,
    p_categories: categories && categories.length ? categories : null,
    p_sido: q.sido ?? null,
    p_sigungu: q.sigungu ?? null,
    p_area: q.area ?? null,
    p_free: q.price === 'free',
    p_tags: tags && tags.length ? tags : null,
    p_q: q.q ?? null,
    p_lat: q.lat ?? null,
    p_lng: q.lng ?? null,
    p_radius: q.radius ?? null,
    p_sort: q.sort,
    p_limit: q.pageSize,
    p_offset: (q.page - 1) * q.pageSize,
  }
}

function isCategory(v: string): v is EventCategory {
  return (CATEGORY_VALUES as readonly string[]).includes(v)
}

// ── RPC 반환 행(snake_case) ──
export interface SearchEventRow {
  id: string
  title: string
  category: EventCategory
  start_date: string
  end_date: string
  start_time: string | null
  end_time: string | null
  venue_name: string | null
  address: string | null
  road_address: string | null
  lat: number | null
  lng: number | null
  region_sido: string | null
  region_sigungu: string | null
  area_detail: string | null
  price_type: PriceType
  price_min: number | null
  price_max: number | null
  booking_url: string | null
  homepage_url: string | null
  thumbnail_url: string | null
  tags: string[] | null
  status: EventStatus
  source_url: string | null
  distance_m: number | null
  total_count: number
}

export interface GetEventRow {
  id: string
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
  lat: number | null
  lng: number | null
  region_sido: string | null
  region_sigungu: string | null
  area_detail: string | null
  price_type: PriceType
  price_min: number | null
  price_max: number | null
  booking_url: string | null
  homepage_url: string | null
  thumbnail_url: string | null
  images: unknown // jsonb
  tags: string[] | null
  status: EventStatus
  source_url: string | null
}

export function toListItem(r: SearchEventRow): EventListItem {
  return {
    id: r.id,
    title: r.title,
    category: r.category,
    startDate: r.start_date,
    endDate: r.end_date,
    startTime: r.start_time,
    endTime: r.end_time,
    venueName: r.venue_name,
    address: r.address,
    lat: r.lat,
    lng: r.lng,
    regionSido: r.region_sido,
    regionSigungu: r.region_sigungu,
    areaDetail: r.area_detail,
    priceType: r.price_type,
    thumbnailUrl: r.thumbnail_url,
    bookingUrl: r.booking_url,
    tags: r.tags ?? [],
    distanceM: r.distance_m,
  }
}

export function toDetail(r: GetEventRow): EventDetail {
  return {
    id: r.id,
    title: r.title,
    description: r.description,
    category: r.category,
    startDate: r.start_date,
    endDate: r.end_date,
    startTime: r.start_time,
    endTime: r.end_time,
    venueName: r.venue_name,
    address: r.address,
    roadAddress: r.road_address,
    lat: r.lat,
    lng: r.lng,
    regionSido: r.region_sido,
    regionSigungu: r.region_sigungu,
    areaDetail: r.area_detail,
    priceType: r.price_type,
    priceMin: r.price_min,
    priceMax: r.price_max,
    bookingUrl: r.booking_url,
    homepageUrl: r.homepage_url,
    thumbnailUrl: r.thumbnail_url,
    images: Array.isArray(r.images) ? (r.images as string[]) : [],
    tags: r.tags ?? [],
    status: r.status,
    sourceUrl: r.source_url,
  }
}
