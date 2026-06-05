'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventListItem } from '@/types/api'
import { CATEGORY_COLOR } from '@/lib/format'

export function CalendarView({
  events,
  onDateClick,
  onEventClick,
}: {
  events: EventListItem[]
  onDateClick?: (date: string) => void
  onEventClick?: (id: string) => void
}) {
  const fcEvents = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: addDay(e.endDate), // FullCalendar의 end는 배타적(exclusive) → 종료일 +1
    backgroundColor: CATEGORY_COLOR[e.category],
    borderColor: CATEGORY_COLOR[e.category],
  }))

  return (
    <FullCalendar
      plugins={[dayGridPlugin, interactionPlugin]}
      initialView="dayGridMonth"
      locale={koLocale}
      height="auto"
      events={fcEvents}
      dateClick={(arg) => onDateClick?.(arg.dateStr)}
      eventClick={(arg) => {
        arg.jsEvent.preventDefault()
        if (arg.event.id) onEventClick?.(arg.event.id)
      }}
      dayMaxEvents={3}
      displayEventTime={false}
    />
  )
}

function addDay(isoDate: string): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
