'use client'

import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import koLocale from '@fullcalendar/core/locales/ko'
import type { EventInput } from '@fullcalendar/core'
import type { EventListItem } from '@/types/api'
import { CATEGORY_COLOR } from '@/lib/format'

export function CalendarView({
  events,
  selectedDate,
  onDateClick,
  onEventClick,
}: {
  events: EventListItem[]
  selectedDate?: string | null
  onDateClick?: (date: string) => void
  onEventClick?: (id: string) => void
}) {
  const fcEvents: EventInput[] = events.map((e) => ({
    id: e.id,
    title: e.title,
    start: e.startDate,
    end: addDay(e.endDate), // FullCalendar의 end는 배타적(exclusive) → 종료일 +1
    backgroundColor: CATEGORY_COLOR[e.category],
    borderColor: CATEGORY_COLOR[e.category],
  }))

  // 선택 날짜는 background 이벤트로 셀을 칠한다(events 변경이라 클릭마다 확실히 다시 렌더됨)
  if (selectedDate) {
    fcEvents.push({
      start: selectedDate,
      end: addDay(selectedDate),
      display: 'background',
      backgroundColor: 'rgba(56, 189, 248, 0.65)', // 밝은 하늘색(다크 배경·주황 이벤트와 대비)
    })
  }

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
      dayMaxEvents={2}
      displayEventTime={false}
    />
  )
}

function addDay(isoDate: string): string {
  const d = new Date(isoDate)
  d.setDate(d.getDate() + 1)
  return d.toISOString().slice(0, 10)
}
