'use client'

import type { EventCategory } from '@/types/event'
import { CATEGORY_COLOR, CATEGORY_LABEL, CATEGORY_ORDER } from '@/lib/format'

export interface FilterState {
  categories: EventCategory[]
  freeOnly: boolean
  q: string
}

export function FilterBar({
  state,
  onChange,
}: {
  state: FilterState
  onChange: (next: FilterState) => void
}) {
  const toggleCategory = (c: EventCategory) => {
    const has = state.categories.includes(c)
    onChange({
      ...state,
      categories: has
        ? state.categories.filter((x) => x !== c)
        : [...state.categories, c],
    })
  }

  return (
    <div className="flex flex-col gap-3">
      <input
        type="search"
        value={state.q}
        onChange={(e) => onChange({ ...state, q: e.target.value })}
        placeholder="이벤트 검색"
        className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm outline-none focus:border-zinc-400 dark:border-zinc-800 dark:bg-zinc-900"
      />

      <div className="flex flex-wrap gap-1.5">
        {CATEGORY_ORDER.map((c) => {
          const active = state.categories.includes(c)
          return (
            <button
              key={c}
              type="button"
              onClick={() => toggleCategory(c)}
              className="rounded-full border px-2.5 py-1 text-xs font-medium transition"
              style={
                active
                  ? {
                      backgroundColor: CATEGORY_COLOR[c],
                      color: 'white',
                      borderColor: CATEGORY_COLOR[c],
                    }
                  : { borderColor: '#e4e4e7', color: '#71717a' }
              }
            >
              {CATEGORY_LABEL[c]}
            </button>
          )
        })}
      </div>

      <label className="flex w-fit cursor-pointer items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
        <input
          type="checkbox"
          checked={state.freeOnly}
          onChange={(e) => onChange({ ...state, freeOnly: e.target.checked })}
        />
        무료만 보기
      </label>
    </div>
  )
}
