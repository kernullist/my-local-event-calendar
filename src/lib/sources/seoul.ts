import type { EventCategory, PriceType } from '@/types/event'
import { contentHash } from '@/lib/dedup/hash'
import type { FetchOptions, SourceAdapter } from './types'

// 서울 열린데이터광장 — 문화행사 정보(culturalEventInfo)
const BASE = 'http://openapi.seoul.go.kr:8088'

interface SeoulRow {
  CODENAME?: string // 분류명(전시/미술, 축제 등)
  GUNAME?: string // 자치구
  TITLE?: string
  PLACE?: string // 장소
  ORG_NAME?: string
  PROGRAM?: string
  ETC_DESC?: string
  ORG_LINK?: string // 신청/바로가기 링크
  MAIN_IMG?: string // 대표 이미지
  STRTDATE?: string // 'YYYY-MM-DD HH:mm:ss.0'
  END_DATE?: string
  IS_FREE?: string // '무료' | '유료'
  HMPG_ADDR?: string // 홈페이지
  LOT?: string // 경도(lng)  ※ 서울 문화행사 API 좌표 축
  LAT?: string // 위도(lat)
}

// 분류명(CODENAME) → 카테고리. 위에서부터 첫 매칭 적용.
const CODENAME_CATEGORY: Array<[RegExp, EventCategory]> = [
  [/전시|미술/, 'exhibition'],
  [/축제/, 'festival'],
  [/콘서트|클래식|국악|독주|독창|합창/, 'concert'],
  [/연극|뮤지컬|오페라|무용|음악극/, 'performance'],
  [/교육|체험/, 'academic'],
]

export const seoulAdapter: SourceAdapter<SeoulRow> = {
  id: 'seoul',

  async *fetchRaw({ maxPages = 5 }: FetchOptions = {}) {
    const key = process.env.SEOUL_OPENAPI_KEY
    if (!key) throw new Error('SEOUL_OPENAPI_KEY 미설정')

    const size = 1000 // 서울 API 1회 최대 1000건
    let page = 0

    while (page < maxPages) {
      const start = page * size + 1
      const end = start + size - 1
      const url = `${BASE}/${key}/json/culturalEventInfo/${start}/${end}/`

      const res = await fetch(url)
      if (!res.ok) throw new Error(`Seoul API HTTP ${res.status}`)
      const json = await res.json()

      const rows: SeoulRow[] = json?.culturalEventInfo?.row ?? []
      if (rows.length === 0) break
      for (const r of rows) yield r

      const total = Number(json?.culturalEventInfo?.list_total_count ?? 0)
      if (end >= total) break
      page++
    }
  },

  normalize(r) {
    const start = isoDate(r.STRTDATE)
    if (!r.TITLE || !start) return null
    const end = isoDate(r.END_DATE) ?? start

    const priceType: PriceType =
      r.IS_FREE === '무료' ? 'free' : r.IS_FREE === '유료' ? 'paid' : 'unknown'

    return {
      sourceId: 'seoul',
      // 서울 API는 고유 ID가 없어 (제목+시작일+장소)로 합성 → 재수집 시 동일 키로 upsert
      externalId: contentHash([r.TITLE, start, r.PLACE]),
      title: r.TITLE.trim(),
      description: r.PROGRAM || r.ETC_DESC || null,
      category: mapCategory(r.CODENAME),
      startDate: start,
      endDate: end,
      venueName: r.PLACE || null,
      address: r.PLACE || null, // 별도 도로명주소 없음 → 좌표 없을 때 지오코딩으로 보강
      lat: toCoord(r.LAT),
      lng: toCoord(r.LOT),
      regionSido: '서울특별시',
      regionSigungu: r.GUNAME || null,
      priceType,
      bookingUrl: r.ORG_LINK || null,
      homepageUrl: r.HMPG_ADDR || null,
      thumbnailUrl: r.MAIN_IMG || null,
      sourceUrl: r.ORG_LINK || null,
      tags: [r.CODENAME, r.GUNAME].filter((v): v is string => Boolean(v)),
    }
  },
}

function mapCategory(codename?: string): EventCategory {
  if (!codename) return 'etc'
  for (const [re, cat] of CODENAME_CATEGORY) if (re.test(codename)) return cat
  return 'etc'
}

function toCoord(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) && n !== 0 ? n : null
}

function isoDate(s?: string): string | null {
  if (!s) return null
  const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : null
}
