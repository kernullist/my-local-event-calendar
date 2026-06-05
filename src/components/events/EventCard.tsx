import type { EventListItem } from '@/types/api'
import { CATEGORY_COLOR, CATEGORY_LABEL, formatDateRange } from '@/lib/format'

export function EventCard({
  event,
  selected,
  onClick,
}: {
  event: EventListItem
  selected?: boolean
  onClick?: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex w-full gap-3 rounded-lg border p-3 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-900 ${
        selected
          ? 'border-zinc-900 dark:border-zinc-100'
          : 'border-zinc-200 dark:border-zinc-800'
      }`}
    >
      <span
        className="mt-0.5 h-12 w-1.5 shrink-0 rounded-full"
        style={{ backgroundColor: CATEGORY_COLOR[event.category] }}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span
            className="rounded px-1.5 py-0.5 text-xs font-medium text-white"
            style={{ backgroundColor: CATEGORY_COLOR[event.category] }}
          >
            {CATEGORY_LABEL[event.category]}
          </span>
          {event.priceType === 'free' && (
            <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-xs font-medium text-emerald-700">
              무료
            </span>
          )}
        </div>
        <h3 className="mt-1 truncate font-medium text-zinc-900 dark:text-zinc-100">
          {event.title}
        </h3>
        <p className="mt-0.5 truncate text-sm text-zinc-500">
          {formatDateRange(event.startDate, event.endDate)}
          {event.venueName ? ` · ${event.venueName}` : ''}
        </p>
        {event.regionSido && (
          <p className="truncate text-xs text-zinc-400">
            {event.regionSido}
            {event.regionSigungu ? ` ${event.regionSigungu}` : ''}
          </p>
        )}
      </div>
    </button>
  )
}
