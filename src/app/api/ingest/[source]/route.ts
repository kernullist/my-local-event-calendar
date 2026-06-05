import { isAuthorizedCron } from '@/lib/cron'
import { runIngest } from '@/lib/sources/pipeline'
import { seoulAdapter } from '@/lib/sources/seoul'
import { tourApiAdapter } from '@/lib/sources/tourapi'
import type { SourceAdapter } from '@/lib/sources/types'

export const runtime = 'nodejs' // node:crypto, 외부 fetch 사용
export const maxDuration = 60
export const dynamic = 'force-dynamic'

const ADAPTERS: Record<string, SourceAdapter> = {
  tourapi: tourApiAdapter,
  seoul: seoulAdapter,
}

/**
 * GET /api/ingest/[source] — 데이터 수집 트리거(Vercel Cron / 수동).
 * 인증: Authorization: Bearer <CRON_SECRET> 또는 ?secret=<CRON_SECRET>
 */
export async function GET(
  req: Request,
  ctx: { params: Promise<{ source: string }> },
) {
  if (!isAuthorizedCron(req)) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { source } = await ctx.params
  const adapter = ADAPTERS[source]
  if (!adapter) {
    return Response.json({ error: `알 수 없는 소스: ${source}` }, { status: 400 })
  }

  try {
    const started = Date.now()
    const result = await runIngest(adapter)
    return Response.json({ ok: true, source, ...result, elapsedMs: Date.now() - started })
  } catch (e) {
    console.error(`[ingest:${source}]`, e)
    return Response.json(
      { ok: false, source, error: e instanceof Error ? e.message : String(e) },
      { status: 500 },
    )
  }
}
