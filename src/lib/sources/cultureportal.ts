import { XMLParser } from 'fast-xml-parser'
import type { EventCategory } from '@/types/event'
import type { FetchOptions, SourceAdapter } from './types'

// 한국문화정보원 "한눈에보는문화정보"(공공데이터포털 B553457). 전국 공연·전시, 좌표 제공.
const BASE = 'https://apis.data.go.kr/B553457/cultureinfo'

interface CultureItem {
  seq?: string
  title?: string
  serviceName?: string // 전시/공연 등
  realmName?: string // 분야(전시/미술/음악/연극/뮤지컬/무용/국악 등)
  startDate?: string // YYYYMMDD
  endDate?: string
  place?: string
  area?: string // 시도(서울/경기/부산 …)
  sigungu?: string
  thumbnail?: string
  gpsX?: string // 경도(lng)
  gpsY?: string // 위도(lat)
  url?: string
}

const REALM_CATEGORY: Array<[RegExp, EventCategory]> = [
  [/전시|미술|회화|조각|공예|사진|디자인|조형/, 'exhibition'],
  [/뮤지컬|연극|무용|오페라|마당|아동|가족|서커스|마술/, 'performance'],
  [/음악|콘서트|클래식|국악|재즈|대중|오케스트라|독주|합창/, 'concert'],
  [/축제|페스티벌/, 'festival'],
]

// 시도 약칭 → 정식명(다른 소스와 표기 통일)
const SIDO_MAP: Record<string, string> = {
  서울: '서울특별시', 부산: '부산광역시', 대구: '대구광역시', 인천: '인천광역시',
  광주: '광주광역시', 대전: '대전광역시', 울산: '울산광역시', 세종: '세종특별자치시',
  경기: '경기도', 강원: '강원특별자치도', 충북: '충청북도', 충남: '충청남도',
  전북: '전북특별자치도', 전남: '전라남도', 경북: '경상북도', 경남: '경상남도',
  제주: '제주특별자치도',
}

const parser = new XMLParser({ ignoreAttributes: true, parseTagValue: false })

export const culturePortalAdapter: SourceAdapter<CultureItem> = {
  id: 'culture',

  async *fetchRaw({ maxPages = 5 }: FetchOptions = {}) {
    const key = process.env.CULTURE_API_KEY
    if (!key) throw new Error('CULTURE_API_KEY 미설정')

    const from = compactToday(-30)
    const to = compactToday(180) // 향후 약 6개월
    let pageNo = 1

    while (pageNo <= maxPages) {
      const url = new URL(`${BASE}/period2`)
      url.searchParams.set('serviceKey', key) // Decoding 키
      url.searchParams.set('numOfrows', '100') // ※ 이 API는 소문자 r (비표준)
      url.searchParams.set('PageNo', String(pageNo)) // ※ 대문자 P (비표준)
      url.searchParams.set('from', from)
      url.searchParams.set('to', to)

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Culture API HTTP ${res.status}`)
      const xml = await res.text()
      const json = parser.parse(xml)

      const items = asArray<CultureItem>(json?.response?.body?.items?.item)
      if (items.length === 0) break
      for (const it of items) yield it

      const total = Number(json?.response?.body?.totalCount ?? 0)
      if (pageNo * 100 >= total) break
      pageNo++
    }
  },

  normalize(it) {
    const start = compactToIso(it.startDate)
    if (!it.title || !start) return null
    const end = compactToIso(it.endDate) ?? start

    return {
      sourceId: 'culture',
      externalId: String(it.seq || `${it.title}-${start}`),
      title: String(it.title).trim(),
      category: mapRealm(it.realmName || it.serviceName),
      startDate: start,
      endDate: end,
      venueName: it.place || null,
      address: it.place || null,
      lat: toCoord(it.gpsY), // gpsY = 위도
      lng: toCoord(it.gpsX), // gpsX = 경도
      regionSido: normalizeSido(it.area),
      regionSigungu: it.sigungu || null,
      priceType: 'unknown', // 목록(period2)엔 가격 없음(detail2에 존재)
      thumbnailUrl: it.thumbnail || null,
      homepageUrl: it.url || null,
      sourceUrl: it.url || null,
      tags: [it.realmName].filter((v): v is string => Boolean(v)),
    }
  },
}

function mapRealm(realm?: string): EventCategory {
  if (!realm) return 'etc'
  for (const [re, cat] of REALM_CATEGORY) if (re.test(realm)) return cat
  return 'etc'
}

function normalizeSido(area?: string): string | null {
  if (!area) return null
  const a = area.trim()
  return SIDO_MAP[a] ?? a
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

function asArray<T>(v: T | T[] | undefined | null): T[] {
  if (v == null) return []
  return Array.isArray(v) ? v : [v]
}
