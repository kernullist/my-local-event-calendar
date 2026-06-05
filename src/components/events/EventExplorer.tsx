'use client'

import { useMemo, useState } from 'react'
import dynamic from 'next/dynamic'
import { X } from 'lucide-react'
import { useEvents } from '@/hooks/useEvents'
import { FilterBar, type FilterState } from '@/components/filters/FilterBar'
import { CalendarView } from '@/components/calendar/CalendarView'
import { EventList } from '@/components/events/EventList'

// Leaflet은 window 의존 → SSR 비활성화로 클라이언트에서만 로드
const MapView = dynamic(() => import('@/components/map/MapView'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
      지도 불러오는 중…
    </div>
  ),
})

export function EventExplorer() {
  const [filter, setFilter] = useState<FilterState>({
    categories: [],
    freeOnly: false,
    q: '',
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  // 날짜는 클라이언트에서 필터(캘린더는 월 전체를 봐야 하므로) → 서버엔 카테고리/무료/검색만 전달
  const { data, isLoading, isError } = useEvents({
    category: filter.categories.join(',') || undefined,
    price: filter.freeOnly ? 'free' : undefined,
    q: filter.q || undefined,
    pageSize: 500,
  })

  const allEvents = useMemo(() => data?.items ?? [], [data])
  const visibleEvents = useMemo(() => {
    if (!selectedDate) return allEvents
    return allEvents.filter(
      (e) => e.startDate <= selectedDate && selectedDate <= e.endDate,
    )
  }, [allEvents, selectedDate])

  return (
    <div className="flex h-full flex-col lg:flex-row">
      {/* 좌: 필터 + 캘린더 + 리스트 */}
      <div className="flex w-full flex-col gap-4 overflow-y-auto border-r border-zinc-200 p-4 dark:border-zinc-800 lg:w-[460px]">
        <FilterBar state={filter} onChange={setFilter} />

        {selectedDate && (
          <button
            type="button"
            onClick={() => setSelectedDate(null)}
            className="flex w-fit items-center gap-1 rounded-full bg-zinc-900 px-3 py-1 text-xs text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            {selectedDate} 만 보기 <X size={12} />
          </button>
        )}

        <CalendarView
          events={allEvents}
          onDateClick={setSelectedDate}
          onEventClick={setSelectedId}
        />

        <div>
          <div className="mb-2 text-sm text-zinc-500">
            {isLoading
              ? '불러오는 중…'
              : isError
                ? '불러오기 실패'
                : `${visibleEvents.length}건`}
          </div>
          <EventList
            events={visibleEvents}
            selectedId={selectedId}
            onSelect={(e) => setSelectedId(e.id)}
          />
        </div>
      </div>

      {/* 우: 지도 */}
      <div className="h-72 flex-1 lg:h-auto">
        <MapView events={visibleEvents} onSelect={(e) => setSelectedId(e.id)} />
      </div>
    </div>
  )
}
