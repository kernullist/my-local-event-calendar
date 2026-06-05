interface GeoResult {
  lat: number
  lng: number
  roadAddress: string | null
}

// 같은 주소 반복 호출 방지(프로세스 메모리 캐시). 수집 1회 실행 동안 유효.
const cache = new Map<string, GeoResult | null>()

/**
 * 주소 → 좌표(WGS84). VWorld Geocoder API 2.0 사용(서버 전용 VWORLD_API_KEY).
 * 1) 도로명(ROAD) → 2) 실패 시 지번(PARCEL) 폴백 → 3) 그래도 실패면 null.
 */
export async function geocodeAddress(query: string): Promise<GeoResult | null> {
  const q = query.trim()
  if (!q) return null
  if (cache.has(q)) return cache.get(q) ?? null

  const result = (await geocode(q, 'ROAD')) ?? (await geocode(q, 'PARCEL'))
  cache.set(q, result)
  return result
}

async function geocode(address: string, type: 'ROAD' | 'PARCEL'): Promise<GeoResult | null> {
  const key = process.env.VWORLD_API_KEY
  if (!key) throw new Error('VWORLD_API_KEY 미설정')

  const url = new URL('https://api.vworld.kr/req/address')
  url.searchParams.set('service', 'address')
  url.searchParams.set('request', 'getcoord')
  url.searchParams.set('version', '2.0')
  url.searchParams.set('crs', 'epsg:4326') // 경위도(WGS84)
  url.searchParams.set('type', type)
  url.searchParams.set('address', address)
  url.searchParams.set('format', 'json')
  url.searchParams.set('key', key)

  const res = await fetch(url)
  if (!res.ok) {
    if (res.status === 429) throw new Error('VWorld 지오코딩 rate limit (429)')
    return null
  }

  const json = (await res.json()) as VWorldResponse
  if (json?.response?.status !== 'OK') return null

  const point = json.response.result?.point
  if (!point) return null

  return {
    lat: Number(point.y), // y=위도(lat)
    lng: Number(point.x), // x=경도(lng)
    roadAddress: type === 'ROAD' ? (json.response.refined?.text ?? null) : null,
  }
}

interface VWorldResponse {
  response?: {
    status?: string // 'OK' | 'NOT_FOUND' | 'ERROR'
    result?: { point?: { x: string; y: string } }
    refined?: { text?: string }
  }
}
