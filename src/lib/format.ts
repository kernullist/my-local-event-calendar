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

// 지역 필터 옵션(정식 시도명 → 짧은 표기). region_sido 값과 매칭.
export const SIDO_OPTIONS: { value: string; label: string }[] = [
  { value: '서울특별시', label: '서울' },
  { value: '경기도', label: '경기' },
  { value: '인천광역시', label: '인천' },
  { value: '강원특별자치도', label: '강원' },
  { value: '충청북도', label: '충북' },
  { value: '충청남도', label: '충남' },
  { value: '대전광역시', label: '대전' },
  { value: '세종특별자치시', label: '세종' },
  { value: '전북특별자치도', label: '전북' },
  { value: '전라남도', label: '전남' },
  { value: '광주광역시', label: '광주' },
  { value: '경상북도', label: '경북' },
  { value: '경상남도', label: '경남' },
  { value: '대구광역시', label: '대구' },
  { value: '부산광역시', label: '부산' },
  { value: '울산광역시', label: '울산' },
  { value: '제주특별자치도', label: '제주' },
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
