import type { EventListItem } from '@/types/api'
import { EventCard } from './EventCard'

export function EventList({ events }: { events: EventListItem[] }) {
  if (events.length === 0) {
    return (
      <p className="px-1 py-8 text-center text-sm text-zinc-400">
        해당 조건의 이벤트가 없습니다.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {events.map((e) => (
        <EventCard key={e.id} event={e} />
      ))}
    </div>
  )
}
