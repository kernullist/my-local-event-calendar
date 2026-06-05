import { isAuthorizedCron } from '@/lib/cron'
import { createAdminClient } from '@/lib/supabase/admin'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

/**
 * GET /api/verify-status — 종료일이 지난 active 이벤트를 ended 로 전환(상태 검증).
 * 인증: Authorization: Bearer <CRON_SECRET> 또는 ?secret=<CRON_SECRET>
 */
export async function GET(req: Request) {
  if (!isAuthorizedCron(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const today = new Date().toISOString().slice(0, 10)

  const { data, error } = await admin
    .from('events')
    .update({ status: 'ended', last_verified_at: new Date().toISOString() })
    .lt('end_date', today)
    .eq('status', 'active')
    .select('id')

  if (error) {
    return Response.json({ ok: false, error: error.message }, { status: 500 })
  }
  return Response.json({ ok: true, ended: data?.length ?? 0 })
}
