-- 0001_init.sql — 로컬 이벤트 캘린더 초기 스키마
-- 대상: Supabase (PostgreSQL 15+ / PostGIS)
-- 적용: Supabase SQL Editor에 붙여넣기, 또는 `supabase db push`
-- 참고: 설계서 DESIGN.md §2~§3

-- ── 확장 ──────────────────────────────────────────────
create extension if not exists postgis;   -- 공간 컬럼/쿼리(geography, ST_DWithin)
create extension if not exists pg_trgm;    -- 한국어 제목 유사/부분 검색

-- ── Enum 타입 ─────────────────────────────────────────
create type event_category as enum
  ('exhibition','festival','concert','performance','popup','academic','etc');
  -- 전시 / 축제 / 콘서트 / 연극·뮤지컬 / 브랜드팝업 / 학술·네트워킹 / 기타
create type price_type    as enum ('free','paid','unknown');
create type event_status  as enum ('active','ended','cancelled');
create type report_reason as enum ('ended','wrong_info','wrong_location','other');
create type report_status as enum ('open','resolved','rejected');

-- ── updated_at 자동 갱신 트리거 함수 ──────────────────
create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ── sources : 데이터 출처 ─────────────────────────────
create table sources (
  id              text primary key,            -- 'tourapi', 'seoul'
  name            text not null,
  base_url        text,
  last_synced_at  timestamptz
);

-- ── events : 이벤트 본체 ──────────────────────────────
create table events (
  id                 uuid primary key default gen_random_uuid(),
  source_id          text not null references sources(id),
  external_id        text not null,             -- 출처 원본 ID(중복/upsert 기준)
  title              text not null,
  description        text,
  category           event_category not null default 'etc',
  start_date         date not null,
  end_date           date not null,
  start_time         time,                       -- nullable(종일/미정)
  end_time           time,
  venue_name         text,
  address            text,
  road_address       text,
  location           geography(Point, 4326),     -- WGS84, nullable(지오코딩 실패 시 null)
  region_sido        text,                        -- 서울특별시 등
  region_sigungu     text,                        -- 성동구 등
  area_detail        text,                        -- 성수/홍대/강남 등 세분화
  price_type         price_type not null default 'unknown',
  price_min          integer,
  price_max          integer,
  booking_url        text,
  homepage_url       text,
  thumbnail_url      text,
  images             jsonb not null default '[]'::jsonb,
  tags               text[] not null default '{}',
  status             event_status not null default 'active',
  source_url         text,
  content_hash       text,                        -- 변경 감지(상태검증 cron)
  canonical_event_id uuid references events(id),  -- 소스간 dedup 대표(2단계)
  last_verified_at   timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now(),
  constraint uq_source_external unique (source_id, external_id),
  constraint chk_dates check (end_date >= start_date)
);

create trigger trg_events_updated
  before update on events
  for each row execute function set_updated_at();

-- 인덱스(설계서 §2.3)
create index idx_events_location   on events using gist (location);
create index idx_events_dates      on events (start_date, end_date);
create index idx_events_category   on events (category);
create index idx_events_region     on events (region_sido, region_sigungu);
create index idx_events_status     on events (status);
create index idx_events_title_trgm on events using gin (title gin_trgm_ops);

-- ── profiles : auth.users 와 1:1 ──────────────────────
create table profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  created_at    timestamptz not null default now()
);

-- 신규 가입 시 profile 자동 생성
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ── bookmarks : 찜 ────────────────────────────────────
create table bookmarks (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references profiles(id) on delete cascade,
  event_id    uuid not null references events(id) on delete cascade,
  created_at  timestamptz not null default now(),
  constraint uq_bookmark unique (user_id, event_id)
);
create index idx_bookmarks_user on bookmarks (user_id);

-- ── event_reports : 사용자 제보 ───────────────────────
create table event_reports (
  id          uuid primary key default gen_random_uuid(),
  event_id    uuid not null references events(id) on delete cascade,
  user_id     uuid references profiles(id) on delete set null,  -- 익명 제보 허용
  reason      report_reason not null,
  comment     text,
  status      report_status not null default 'open',
  created_at  timestamptz not null default now()
);
create index idx_reports_event  on event_reports (event_id);
create index idx_reports_status on event_reports (status);

-- ── RLS(Row Level Security) ───────────────────────────
alter table sources       enable row level security;
alter table events        enable row level security;
alter table profiles      enable row level security;
alter table bookmarks     enable row level security;
alter table event_reports enable row level security;

-- 공개 읽기: sources, events (anon + authenticated)
create policy "public read sources" on sources for select using (true);
create policy "public read events"  on events  for select using (true);

-- profiles: 본인만
create policy "own profile select" on profiles for select using (auth.uid() = id);
create policy "own profile update" on profiles for update using (auth.uid() = id);

-- bookmarks: 본인만 CRUD
create policy "own bookmarks select" on bookmarks for select using (auth.uid() = user_id);
create policy "own bookmarks insert" on bookmarks for insert with check (auth.uid() = user_id);
create policy "own bookmarks delete" on bookmarks for delete using (auth.uid() = user_id);

-- event_reports: 누구나 제보(insert), 본인 것만 조회
create policy "anyone insert report" on event_reports for insert with check (true);
create policy "own reports select"   on event_reports for select using (auth.uid() = user_id);

-- 주의: service_role 키는 RLS를 우회한다(서버 수집/관리 라우트 전용).
--       따라서 ingest/verify 라우트는 service_role 로 동작하며 별도 정책이 필요 없다.

-- ── 시드: 소스 등록 ───────────────────────────────────
insert into sources (id, name, base_url) values
  ('tourapi', '한국관광공사 TourAPI 4.0', 'https://apis.data.go.kr/B551011/KorService2'),
  ('seoul',   '서울 열린데이터광장 문화행사', 'http://openapi.seoul.go.kr:8088')
on conflict (id) do nothing;
