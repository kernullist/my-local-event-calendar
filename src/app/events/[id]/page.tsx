import { cache } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { toDetail, type GetEventRow } from "@/lib/events/query";
import { formatDateRange } from "@/lib/format";
import { EventDetail } from "@/components/events/EventDetail";

// 같은 요청 내 generateMetadata + 페이지에서 중복 호출되지 않도록 캐시
const getEvent = cache(async (id: string) => {
  const supabase = await createClient();
  const { data } = await supabase.rpc("get_event", { p_id: id });
  const rows = (data ?? []) as GetEventRow[];
  return rows.length ? toDetail(rows[0]) : null;
});

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) return { title: "이벤트를 찾을 수 없습니다" };

  const desc =
    event.description?.slice(0, 120) ??
    `${formatDateRange(event.startDate, event.endDate)} · ${event.venueName ?? event.regionSido ?? ""}`;

  return {
    title: `${event.title} | 로컬 이벤트 캘린더`,
    description: desc,
    openGraph: {
      title: event.title,
      description: desc,
      images: event.thumbnailUrl ? [event.thumbnailUrl] : undefined,
    },
  };
}

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event) notFound();
  return <EventDetail event={event} />;
}
