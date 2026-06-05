interface GeoResult {
  lat: number
  lng: number
  roadAddress: string | null
}

// 같은 주소 반복 호출 방지(프로세스 메모리 캐시). 수집 1회 실행 동안 유효.
const cache = new Map<string, GeoResult | null>()

/**
 * 주소/장소명 → 좌표(WGS84).
 * 1) 주소 검색 → 2) 실패 시 키워드 검색 폴백 → 3) 그래도 실패면 null.
 * Kakao Local REST API 사용(서버 전용 KAKAO_REST_API_KEY).
 */
export async function geocodeAddress(query: string): Promise<GeoResult | null> {
  const q = query.trim()
  if (!q) return null
  if (cache.has(q)) return cache.get(q) ?? null

  const result = (await searchAddress(q)) ?? (await searchKeyword(q))
  cache.set(q, result)
  return result
}

async function searchAddress(query: string): Promise<GeoResult | null> {
  const json = await kakaoGet('https://dapi.kakao.com/v2/local/search/address.json', { query })
  const doc = json?.documents?.[0]
  if (!doc) return null
  // Kakao 응답: x=경도(lng), y=위도(lat)
  return {
    lat: Number(doc.y),
    lng: Number(doc.x),
    roadAddress: doc.road_address?.address_name ?? null,
  }
}

async function searchKeyword(query: string): Promise<GeoResult | null> {
  const json = await kakaoGet('https://dapi.kakao.com/v2/local/search/keyword.json', { query })
  const doc = json?.documents?.[0]
  if (!doc) return null
  return {
    lat: Number(doc.y),
    lng: Number(doc.x),
    roadAddress: doc.road_address_name || null,
  }
}

async function kakaoGet(
  base: string,
  params: Record<string, string>,
): Promise<{ documents?: KakaoDoc[] } | null> {
  const key = process.env.KAKAO_REST_API_KEY
  if (!key) throw new Error('KAKAO_REST_API_KEY 미설정')

  const url = new URL(base)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)

  const res = await fetch(url, { headers: { Authorization: `KakaoAK ${key}` } })
  if (!res.ok) {
    if (res.status === 429) throw new Error('Kakao 지오코딩 rate limit (429)')
    return null
  }
  return res.json()
}

interface KakaoDoc {
  x: string
  y: string
  road_address?: { address_name: string } | null
  road_address_name?: string
}
