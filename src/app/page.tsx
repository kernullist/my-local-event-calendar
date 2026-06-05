export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
      <h1 className="text-3xl font-bold tracking-tight">로컬 이벤트 캘린더</h1>
      <p className="max-w-md text-zinc-600 dark:text-zinc-400">
        전국의 전시·축제·공연·팝업 일정을 지도와 캘린더로 한눈에.
      </p>
      <p className="text-sm text-zinc-400 dark:text-zinc-500">
        프로젝트 셋업 완료 — 메인 화면(지도-캘린더)은 M4에서 구현 예정입니다.
      </p>
    </main>
  );
}
