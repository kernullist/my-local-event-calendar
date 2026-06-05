'use client'

import dynamic from 'next/dynamic'
import Link from 'next/link'
import {
  ArrowLeft,
  CalendarDays,
  MapPin,
  Tag,
  Download,
  ExternalLink,
} from 'lucide-react'
import type { EventDetail as EventDetailType } from '@/types/api'
import {
  CATEGORY_COLOR,
  CATEGORY_LABEL,
  formatDateRange,
  priceLabel,
} from '@/lib/format'

const EventMap = dynamic(() => import('@/components/map/EventMap'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-zinc-400">
      지도…
    </div>
  ),
})

export function EventDetail({ event }: { event: EventDetailType }) {
  const color = CATEGORY_COLOR[event.category]

  return (
    <article className="mx-auto max-w-2xl px-4 py-6">
      <Link
        href="/"
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
      >
        <ArrowLeft size={16} /> 목록으로
      </Link>

      {event.thumbnailUrl && (
        // 외부(관광공사 등) 이미지라 next/image 대신 img 사용
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={event.thumbnailUrl}
          alt={event.title}
          className="mb-4 max-h-72 w-full rounded-lg object-cover"
        />
      )}

      <div className="flex items-center gap-1.5">
        <span
          className="rounded px-2 py-0.5 text-xs font-medium text-white"
          style={{ backgroundColor: color }}
        >
          {CATEGORY_LABEL[event.category]}
        </span>
        {event.priceType === 'free' && (
          <span className="rounded bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700">
            무료
          </span>
        )}
      </div>

      <h1 className="mt-2 text-2xl font-bold tracking-tight">{event.title}</h1>

      <dl className="mt-4 flex flex-col gap-2 text-sm">
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <CalendarDays size={16} className="shrink-0 text-zinc-400" />
          {formatDateRange(event.startDate, event.endDate)}
        </div>
        {(event.venueName || event.address) && (
          <div className="flex items-start gap-2 text-zinc-600 dark:text-zinc-300">
            <MapPin size={16} className="mt-0.5 shrink-0 text-zinc-400" />
            <span>{[event.venueName, event.address].filter(Boolean).join(' · ')}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-300">
          <Tag size={16} className="shrink-0 text-zinc-400" />
          {priceLabel(event.priceType, event.priceMin)}
        </div>
      </dl>

      {event.description && (
        <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-zinc-700 dark:text-zinc-300">
          {event.description}
        </p>
      )}

      {event.lat != null && event.lng != null && (
        <div className="mt-4 h-64 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <EventMap
            lat={event.lat}
            lng={event.lng}
            color={color}
            title={event.title}
          />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <a
          href={`/api/events/${event.id}/ics`}
          className="inline-flex items-center gap-1.5 rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-zinc-100 dark:text-zinc-900"
        >
          <Download size={16} /> 캘린더에 추가 (.ics)
        </a>
        {event.bookingUrl && (
          <a
            href={event.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            <ExternalLink size={16} /> 예매·예약
          </a>
        )}
        {event.homepageUrl && (
          <a
            href={event.homepageUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            홈페이지
          </a>
        )}
      </div>
    </article>
  )
}
