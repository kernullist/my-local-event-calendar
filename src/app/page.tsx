import { EventExplorer } from "@/components/events/EventExplorer";

export default function Home() {
  return (
    <div className="flex h-screen flex-col">
      <header className="flex h-14 shrink-0 items-center gap-2 border-b border-zinc-200 px-4 dark:border-zinc-800">
        <h1 className="font-bold tracking-tight">로컬 이벤트 캘린더</h1>
        <span className="text-sm text-zinc-400">전국 문화·축제·팝업</span>
      </header>
      <div className="flex-1 overflow-hidden">
        <EventExplorer />
      </div>
    </div>
  );
}
