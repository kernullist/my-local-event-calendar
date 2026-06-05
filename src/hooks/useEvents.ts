'use client'

import { useQuery } from '@tanstack/react-query'
import type { EventListResponse } from '@/types/api'

export interface EventFilters {
  from?: string
  to?: string
  category?: string // "festival,popup"
  sido?: string
  area?: string
  price?: string // 'free'
  q?: string
  lat?: number
  lng?: number
  radius?: number
  sort?: 'date' | 'distance'
  page?: number
  pageSize?: number
}

function toQueryString(filters: EventFilters): string {
  const qs = new URLSearchParams()
  for (const [key, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null && value !== '') {
      qs.set(key, String(value))
    }
  }
  return qs.toString()
}

/** /api/events 조회 훅. 필터가 바뀌면 자동 재조회. */
export function useEvents(filters: EventFilters) {
  return useQuery({
    queryKey: ['events', filters],
    queryFn: async (): Promise<EventListResponse> => {
      const res = await fetch(`/api/events?${toQueryString(filters)}`)
      if (!res.ok) throw new Error('이벤트 조회에 실패했습니다')
      return res.json()
    },
  })
}
