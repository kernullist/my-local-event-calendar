import type { NormalizedEvent, SourceId } from '@/types/event'

export interface FetchOptions {
  /** 이 시각 이후 수정/등록분만(증분 수집). 미지원 소스는 무시. */
  since?: Date
  /** 가져올 최대 페이지 수(과도한 호출·타임아웃 방지). */
  maxPages?: number
}

/**
 * 데이터 소스 어댑터.
 * 향후 크롤러/LLM 소스('instagram' 등)도 같은 인터페이스로 추가한다(설계서 §4.1).
 */
export interface SourceAdapter<TRaw = unknown> {
  id: SourceId
  /** 출처 원본 레코드를 페이지네이션하며 순차 방출. */
  fetchRaw(options?: FetchOptions): AsyncIterable<TRaw>
  /** 원본 1건 → 정규화. 변환 불가/스킵 대상이면 null. */
  normalize(raw: TRaw): NormalizedEvent | null
}
