import { createClient } from '@/lib/supabase/server'
import {
  EventQuerySchema,
  toListItem,
  toRpcParams,
  type SearchEventRow,
} from '@/lib/events/query'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/events — 필터·검색·위치반경·정렬·페이지네이션.
 * 쿼리 파라미터는 설계서 §5 참고. 캘린더와 지도가 같은 응답을 공유한다.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const parsed = EventQuerySchema.safeParse(Object.fromEntries(searchParams))
  if (!parsed.success) {
    return Response.json(
      { error: '잘못된 쿼리 파라미터', issues: parsed.error.issues },
      { status: 400 },
    )
  }

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('search_events', toRpcParams(parsed.data))
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as SearchEventRow[]
  const total = Number(rows[0]?.total_count ?? 0)

  return Response.json({
    items: rows.map(toListItem),
    page: parsed.data.page,
    pageSize: parsed.data.pageSize,
    total,
  })
}
