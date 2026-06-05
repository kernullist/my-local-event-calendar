import type { EventCategory, PriceType } from '@/types/event'

export const CATEGORY_LABEL: Record<EventCategory, string> = {
  exhibition: '전시',
  festival: '축제',
  concert: '콘서트',
  performance: '연극·뮤지컬',
  popup: '팝업',
  academic: '학술·네트워킹',
  etc: '기타',
}

/** 캘린더 이벤트/지도 핀 색상 (카테고리별). */
export const CATEGORY_COLOR: Record<EventCategory, string> = {
  exhibition: '#6366f1', // indigo
  festival: '#f97316', // orange
  concert: '#ec4899', // pink
  performance: '#8b5cf6', // violet
  popup: '#10b981', // emerald
  academic: '#0ea5e9', // sky
  etc: '#6b7280', // gray
}

export const CATEGORY_ORDER: EventCategory[] = [
  'exhibition', 'festival', 'concert', 'performance', 'popup', 'academic', 'etc',
]

export function priceLabel(price: PriceType, min?: number | null): string {
  if (price === 'free') return '무료'
  if (price === 'paid') return min ? `${min.toLocaleString()}원~` : '유료'
  return '가격 미정'
}

/** 'YYYY-MM-DD' → 'M.D' */
function shortKo(d: string): string {
  const [, m, day] = d.split('-')
  return `${Number(m)}.${Number(day)}`
}

export function formatDateRange(start: string, end: string): string {
  return start === end ? shortKo(start) : `${shortKo(start)} ~ ${shortKo(end)}`
}
