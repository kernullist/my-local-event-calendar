'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/navigation'
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
  const router = useRouter()
  const [filter, setFilter] = useState<FilterState>({
    categories: [],
    sidos: [],
    freeOnly: false,
    q: '',
  })
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // 카테고리/무료/검색은 서버 필터, 지역·날짜는 클라이언트 필터
  const { data, isLoading, isError } = useEvents({
    category: filter.categories.join(',') || undefined,
    price: filter.freeOnly ? 'free' : undefined,
    q: filter.q || undefined,
    pageSize: 800,
  })

  const allEvents = useMemo(() => data?.items ?? [], [data])

  // 지역 필터(캘린더·리스트·지도 공통 적용)
  const regionFiltered = useMemo(() => {
    if (filter.sidos.length === 0) return allEvents
    return allEvents.filter(
      (e) => e.regionSido != null && filter.sidos.includes(e.regionSido),
    )
  }, [allEvents, filter.sidos])

  // 오늘 날짜(YYYY-MM-DD, 로컬) — 종료된 행사 제외용
  const today = useMemo(() => new Date().toLocaleDateString('sv-SE'), [])

  // 리스트·지도 표시:
  //  - 날짜 선택 시: 그 날 진행 중인 것
  //  - 미선택 시: 아직 끝나지 않은 것(종료일 ≥ 오늘) — 이미 끝난 행사 제외
  const visibleEvents = useMemo(() => {
    if (selectedDate) {
      return regionFiltered.filter(
        (e) => e.startDate <= selectedDate && selectedDate <= e.endDate,
      )
    }
    return regionFiltered.filter((e) => e.endDate >= today)
  }, [regionFiltered, selectedDate, today])

  // 캘린더가 길어 리스트가 화면 밖으로 밀리므로, 날짜 선택 시 리스트로 스크롤
  useEffect(() => {
    if (selectedDate) {
      listRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [selectedDate])

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
          events={regionFiltered}
          selectedDate={selectedDate}
          onDateClick={setSelectedDate}
          onEventClick={(id) => router.push(`/events/${id}`)}
        />

        <div ref={listRef} className="scroll-mt-2">
          <div className="mb-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
            {isLoading
              ? '불러오는 중…'
              : isError
                ? '불러오기 실패'
                : selectedDate
                  ? `${selectedDate} · ${visibleEvents.length}건`
                  : `전체 ${visibleEvents.length}건`}
          </div>
          <EventList events={visibleEvents} />
        </div>
      </div>

      {/* 우: 지도 */}
      <div className="h-72 flex-1 lg:h-auto">
        <MapView events={visibleEvents} />
      </div>
    </div>
  )
}
