import { createHash } from 'node:crypto'

/**
 * 변경 감지·중복 판정용 content hash.
 * 정규화된 핵심 식별 요소(제목+시작일+장소 등)를 md5로 묶는다.
 */
export function contentHash(parts: Array<string | null | undefined>): string {
  return createHash('md5')
    .update(parts.map((p) => (p ?? '').trim()).join('|'))
    .digest('hex')
}
