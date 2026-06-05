# 로컬 이벤트 캘린더

전국의 전시·축제·공연·팝업스토어 일정을 **지도 + 캘린더**로 한눈에 보여주는 서비스.
공공 오픈 API에서 이벤트를 수집·정규화하여 위치 기반으로 탐색할 수 있게 합니다.

> 설계 문서: [DESIGN.md](DESIGN.md) · 사전 조사: [event_calendar_research.md](event_calendar_research.md)

## 기술 스택

- **Next.js 16** (App Router) + TypeScript — 프론트 + API(Route Handlers) 풀스택
- **Tailwind CSS v4** + lucide-react
- **Supabase** (PostgreSQL + PostGIS) — DB / Auth
- **Kakao Maps** — 지도 표시 + 지오코딩(주소→좌표)
- **FullCalendar** — 캘린더 뷰
- **TanStack Query** — 클라이언트 데이터 패칭
- 데이터 소스: 한국관광공사 TourAPI 4.0, 서울 열린데이터광장 문화행사

## 사전 준비 (외부 키 발급)

`.env.example`을 `.env.local`로 복사한 뒤 아래 키를 채웁니다.

| 키 | 발급처 |
| :--- | :--- |
| `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | [Supabase](https://supabase.com) 프로젝트 → Settings → API |
| `NEXT_PUBLIC_KAKAO_MAP_JS_KEY`, `KAKAO_REST_API_KEY` | [Kakao Developers](https://developers.kakao.com) 앱 → 앱 키 |
| `TOURAPI_SERVICE_KEY` | [공공데이터포털](https://www.data.go.kr) TourAPI 활용신청 |
| `SEOUL_OPENAPI_KEY` | [서울 열린데이터광장](https://data.seoul.go.kr) 인증키 |
| `CRON_SECRET` | 임의 문자열(수집 라우트 보호용) |

## 설치 & 실행

```bash
npm install
cp .env.example .env.local   # 키 입력
npm run dev                  # http://localhost:3000
```

## DB 마이그레이션 적용

`supabase/migrations/0001_init.sql` 을 적용합니다(둘 중 하나):

- **간편**: Supabase 대시보드 → SQL Editor에 파일 내용을 붙여넣고 실행
- **CLI**: `supabase link` 후 `supabase db push`

> PostGIS·pg_trgm 확장과 RLS 정책, 소스 시드(tourapi/seoul)까지 한 번에 생성됩니다.

## 진행 현황 (마일스톤)

- [x] **M0** 프로젝트 셋업 (Next.js, 의존성, 디렉토리, Supabase 클라이언트)
- [x] **M1** DB 스키마 마이그레이션 작성 (적용은 Supabase 프로젝트 연결 후)
- [x] **M2** 데이터 수집 (TourAPI·서울 어댑터 + 지오코딩 + cron) — 코드 완료, 키 연결 후 실행 검증
- [x] **M3** 조회 API (`/api/events` 필터·검색·공간쿼리) — 코드 완료, DB 연결 후 실행 검증
- [ ] **M4** 메인 UI (지도-캘린더 하이브리드)
- [ ] **M5** 상세 페이지 + `.ics` 내보내기
- [ ] **M6** 인증 + 북마크
- [ ] **M7** 제보 + 상태검증 cron

자세한 범위는 [DESIGN.md §9](DESIGN.md) 참고.
