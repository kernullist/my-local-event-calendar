import { createEvent, type DateArray } from 'ics'
import { createClient } from '@/lib/supabase/server'
import { toDetail, type GetEventRow } from '@/lib/events/query'

export const runtime = 'nodejs'

/** GET /api/events/[id]/ics — 단건 이벤트를 .ics(iCalendar) 파일로 내려준다. */
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params

  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_event', { p_id: id })
  if (error) return new Response(error.message, { status: 500 })

  const rows = (data ?? []) as GetEventRow[]
  if (rows.length === 0) return new Response('not found', { status: 404 })
  const e = toDetail(rows[0])

  const { error: icsError, value } = createEvent({
    title: e.title,
    start: dateParts(e.startDate),
    end: nextDay(e.endDate), // 종일 일정의 DTEND는 배타적 → 종료일 +1
    location: e.venueName ?? e.address ?? undefined,
    description: e.description ?? undefined,
    url: e.bookingUrl ?? e.homepageUrl ?? undefined,
    geo: e.lat != null && e.lng != null ? { lat: e.lat, lon: e.lng } : undefined,
    productId: 'local-event-calendar',
  })

  if (icsError || !value) {
    return new Response('ics 생성 실패', { status: 500 })
  }

  return new Response(value, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `attachment; filename="event-${id}.ics"`,
    },
  })
}

function dateParts(iso: string): DateArray {
  const [y, m, d] = iso.split('-').map(Number)
  return [y, m, d]
}

function nextDay(iso: string): DateArray {
  const d = new Date(`${iso}T00:00:00Z`)
  d.setUTCDate(d.getUTCDate() + 1)
  return [d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate()]
}
