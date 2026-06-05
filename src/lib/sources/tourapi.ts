import type { FetchOptions, SourceAdapter } from './types'

// 한국관광공사 TourAPI 4.0 (KorService2). 축제/행사 검색(searchFestival2).
const BASE = 'https://apis.data.go.kr/B551011/KorService2'

// TourAPI areacode → 시도명 (areacode가 채워져 오는 경우 우선 사용)
const AREA_SIDO: Record<string, string> = {
  '1': '서울특별시', '2': '인천광역시', '3': '대전광역시', '4': '대구광역시',
  '5': '광주광역시', '6': '부산광역시', '7': '울산광역시', '8': '세종특별자치시',
  '31': '경기도', '32': '강원특별자치도', '33': '충청북도', '34': '충청남도',
  '35': '경상북도', '36': '경상남도', '37': '전북특별자치도', '38': '전라남도',
  '39': '제주특별자치도',
}

interface TourItem {
  contentid: string | number
  contenttypeid?: string | number
  title: string
  addr1?: string
  addr2?: string
  mapx?: string | number // 경도(lng)
  mapy?: string | number // 위도(lat)
  eventstartdate?: string // YYYYMMDD
  eventenddate?: string // YYYYMMDD
  firstimage?: string
  firstimage2?: string
  tel?: string
  areacode?: string | number
  sigungucode?: string | number
}

export const tourApiAdapter: SourceAdapter<TourItem> = {
  id: 'tourapi',

  async *fetchRaw({ maxPages = 5 }: FetchOptions = {}) {
    const key = process.env.TOURAPI_SERVICE_KEY
    if (!key) throw new Error('TOURAPI_SERVICE_KEY 미설정')

    const numOfRows = 100
    let pageNo = 1

    while (pageNo <= maxPages) {
      const url = new URL(`${BASE}/searchFestival2`)
      // 공공데이터포털 "일반 인증키(Decoding)" 사용. searchParams가 자동 인코딩한다.
      url.searchParams.set('serviceKey', key)
      url.searchParams.set('MobileOS', 'ETC')
      url.searchParams.set('MobileApp', 'LocalEventCalendar')
      url.searchParams.set('_type', 'json')
      url.searchParams.set('numOfRows', String(numOfRows))
      url.searchParams.set('pageNo', String(pageNo))
      url.searchParams.set('arrange', 'C')
      url.searchParams.set('eventStartDate', compactToday(-30)) // 필수 파라미터

      const res = await fetch(url)
      if (!res.ok) throw new Error(`TourAPI HTTP ${res.status}`)
      const json = await res.json()

      const body = json?.response?.body
      const items = asArray<TourItem>(body?.items?.item)
      if (items.length === 0) break
      for (const it of items) yield it

      const total = Number(body?.totalCount ?? 0)
      if (pageNo * numOfRows >= total) break
      pageNo++
    }
  },

  normalize(it) {
    const start = compactToIso(it.eventstartdate)
    if (!it.title || !start) return null
    const end = compactToIso(it.eventenddate) ?? start

    const address = [it.addr1, it.addr2].filter(Boolean).join(' ') || null

    return {
      sourceId: 'tourapi',
      externalId: String(it.contentid),
      title: it.title.trim(),
      category: 'festival', // searchFestival2 결과는 축제/행사 → festival 고정
      startDate: start,
      endDate: end,
      venueName: null, // 목록 응답엔 장소명 없음(필요 시 detailIntro2로 보강 — 2단계)
      address,
      lat: toCoord(it.mapy),
      lng: toCoord(it.mapx),
      regionSido: resolveSido(it),
      regionSigungu: addrToken(it.addr1, 1),
      priceType: 'unknown',
      thumbnailUrl: it.firstimage2 || it.firstimage || null,
      images: [it.firstimage].filter((v): v is string => Boolean(v)),
      tags: ['축제'],
    }
  },
}

// searchFestival2 응답에 areacode가 비어오는 경우가 있어, 주소(addr1) 첫 토큰으로 시도를 보완.
function resolveSido(item: TourItem): string | null {
  const code = item.areacode != null ? String(item.areacode) : ''
  if (code && AREA_SIDO[code]) return AREA_SIDO[code]
  return addrToken(item.addr1, 0)
}

// addr1 의 n번째 공백 토큰 (0='충청북도', 1='음성군' 등)
function addrToken(addr1: string | undefined, n: number): string | null {
  if (!addr1) return null
  return addr1.trim().split(/\s+/)[n] ?? null
}

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}

function toCoord(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n !== 0 ? n : null
}

function compactToIso(s?: string): string | null {
  if (!s || !/^\d{8}$/.test(s)) return null
  return `${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`
}

function compactToday(offsetDays = 0): string {
  const d = new Date()
  d.setDate(d.getDate() + offsetDays)
  return d.toISOString().slice(0, 10).replace(/-/g, '')
}
