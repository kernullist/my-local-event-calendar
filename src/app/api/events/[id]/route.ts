import { createClient } from '@/lib/supabase/server'
import { toDetail, type GetEventRow } from '@/lib/events/query'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/** GET /api/events/[id] — 단건 상세. */
export async function GET(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_event', { p_id: id })
  if (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }

  const rows = (data ?? []) as GetEventRow[]
  if (rows.length === 0) {
    return Response.json({ error: '이벤트를 찾을 수 없습니다' }, { status: 404 })
  }

  return Response.json(toDetail(rows[0]))
}
