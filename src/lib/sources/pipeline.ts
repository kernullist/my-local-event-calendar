import type { EventInsert, NormalizedEvent } from '@/types/event'
import { createAdminClient } from '@/lib/supabase/admin'
import { geocodeAddress } from '@/lib/geocode/vworld'
import { contentHash } from '@/lib/dedup/hash'
import type { FetchOptions, SourceAdapter } from './types'

export interface IngestResult {
  fetched: number
  upserted: number
  skipped: number
  geocoded: number
}

const BATCH_SIZE = 500

// events.source_id 외래키 충족을 위한 소스 메타(수집 시 자동 등록)
const SOURCE_NAMES: Record<string, string> = {
  tourapi: '한국관광공사 TourAPI 4.0',
  seoul: '서울 열린데이터광장 문화행사',
  culture: '한국문화정보원 한눈에보는문화정보',
}

/**
 * 공통 수집 파이프라인:
 *   sources 보장 → fetchRaw → normalize → (좌표 없으면)지오코딩 → 배치 upsert → last_synced_at 갱신
 */
export async function runIngest(
  adapter: SourceAdapter,
  options?: FetchOptions,
): Promise<IngestResult> {
  const admin = createAdminClient()
  const canGeocode = Boolean(process.env.VWORLD_API_KEY)
  const result: IngestResult = { fetched: 0, upserted: 0, skipped: 0, geocoded: 0 }

  // 소스 행 보장(events 외래키) — 없으면 등록, 있으면 유지
  await admin
    .from('sources')
    .upsert(
      { id: adapter.id, name: SOURCE_NAMES[adapter.id] ?? adapter.id },
      { onConflict: 'id', ignoreDuplicates: true },
    )

  // 배치 내 (source_id, external_id) 중복은 마지막 값으로 합쳐 upsert 충돌을 피한다.
  let batch = new Map<string, EventInsert>()

  const flush = async () => {
    if (batch.size === 0) return
    const rows = Array.from(batch.values())
    const { error } = await admin
      .from('events')
      .upsert(rows, { onConflict: 'source_id,external_id' })
    if (error) throw new Error(`events upsert 실패: ${error.message}`)
    result.upserted += rows.length
    batch = new Map()
  }

  for await (const raw of adapter.fetchRaw(options)) {
    result.fetched++

    const ev = adapter.normalize(raw)
    if (!ev) {
      result.skipped++
      continue
    }

    // 좌표가 없고 주소/장소명이 있으면 지오코딩으로 보강.
    // VWorld 키가 있을 때만 시도하고, 실패(rate limit 등)는 좌표 없이 넘긴다 — 수집 자체를 막지 않는다.
    if (canGeocode && (ev.lat == null || ev.lng == null) && ev.address) {
      try {
        const geo = await geocodeAddress(ev.address)
        if (geo) {
          ev.lat = geo.lat
          ev.lng = geo.lng
          ev.roadAddress = ev.roadAddress ?? geo.roadAddress
          result.geocoded++
        }
      } catch {
        // 무시: location 은 null 로 저장되고 리스트에는 노출됨(지도 핀만 빠짐)
      }
    }

    const row = toEventInsert(ev)
    batch.set(`${row.source_id}:${row.external_id}`, row)
    if (batch.size >= BATCH_SIZE) await flush()
  }
  await flush()

  await admin
    .from('sources')
    .update({ last_synced_at: new Date().toISOString() })
    .eq('id', adapter.id)

  return result
}

function toEventInsert(ev: NormalizedEvent): EventInsert {
  const location =
    ev.lat != null && ev.lng != null ? `SRID=4326;POINT(${ev.lng} ${ev.lat})` : null

  return {
    source_id: ev.sourceId,
    external_id: ev.externalId,
    title: ev.title,
    description: ev.description ?? null,
    category: ev.category,
    start_date: ev.startDate,
    end_date: ev.endDate,
    start_time: ev.startTime ?? null,
    end_time: ev.endTime ?? null,
    venue_name: ev.venueName ?? null,
    address: ev.address ?? null,
    road_address: ev.roadAddress ?? null,
    location,
    region_sido: ev.regionSido ?? null,
    region_sigungu: ev.regionSigungu ?? null,
    area_detail: ev.areaDetail ?? null,
    price_type: ev.priceType ?? 'unknown',
    price_min: ev.priceMin ?? null,
    price_max: ev.priceMax ?? null,
    booking_url: ev.bookingUrl ?? null,
    homepage_url: ev.homepageUrl ?? null,
    thumbnail_url: ev.thumbnailUrl ?? null,
    images: ev.images ?? [],
    tags: ev.tags ?? [],
    source_url: ev.sourceUrl ?? null,
    content_hash: contentHash([ev.title, ev.startDate, ev.venueName ?? ev.address]),
  }
}
