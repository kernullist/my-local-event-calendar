-- 0002_search.sql — 조회용 RPC (필터 / 검색 / 위치 반경 / 정렬 / 페이지네이션)
-- 설계서 DESIGN.md §5. supabase-js 빌더로 표현 못 하는 PostGIS 쿼리를 함수로 캡슐화한다.

-- ── 목록 검색 ─────────────────────────────────────────
-- geography(location)를 lat/lng 로 풀어 반환하고, total_count 를 각 행에 동봉(window).
create or replace function search_events(
  p_from        date              default null,
  p_to          date              default null,
  p_categories  event_category[]  default null,
  p_sido        text              default null,
  p_sigungu     text              default null,
  p_area        text              default null,
  p_free        boolean           default false,
  p_tags        text[]            default null,
  p_q           text              default null,
  p_lat         double precision  default null,
  p_lng         double precision  default null,
  p_radius      integer           default null,   -- meters
  p_sort        text              default 'date',
  p_limit       integer           default 50,
  p_offset      integer           default 0
)
returns table (
  id uuid,
  title text,
  category event_category,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  venue_name text,
  address text,
  road_address text,
  lat double precision,
  lng double precision,
  region_sido text,
  region_sigungu text,
  area_detail text,
  price_type price_type,
  price_min integer,
  price_max integer,
  booking_url text,
  homepage_url text,
  thumbnail_url text,
  tags text[],
  status event_status,
  source_url text,
  distance_m double precision,
  total_count bigint
)
language sql
stable
as $$
  with q_point as (
    select case
      when p_lat is not null and p_lng is not null
      then ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography
      else null
    end as g
  ),
  base as (
    select
      e.*,
      case when qp.g is not null and e.location is not null
        then ST_Distance(e.location, qp.g) else null end as dist
    from events e cross join q_point qp
    where e.status = 'active'
      and (p_from is null or e.end_date   >= p_from)
      and (p_to   is null or e.start_date <= p_to)
      and (p_categories is null or e.category = any(p_categories))
      and (p_sido     is null or e.region_sido    = p_sido)
      and (p_sigungu  is null or e.region_sigungu = p_sigungu)
      and (p_area     is null or e.area_detail     = p_area)
      and (p_free is false or e.price_type = 'free')
      and (p_tags is null or e.tags && p_tags)
      and (p_q is null or e.title ilike '%' || p_q || '%')
      and (
        p_radius is null or qp.g is null
        or (e.location is not null and ST_DWithin(e.location, qp.g, p_radius))
      )
  )
  select
    base.id, base.title, base.category,
    base.start_date, base.end_date, base.start_time, base.end_time,
    base.venue_name, base.address, base.road_address,
    ST_Y(base.location::geometry), ST_X(base.location::geometry),
    base.region_sido, base.region_sigungu, base.area_detail,
    base.price_type, base.price_min, base.price_max,
    base.booking_url, base.homepage_url, base.thumbnail_url,
    base.tags, base.status, base.source_url,
    base.dist,
    count(*) over() as total_count
  from base
  order by
    case when p_sort = 'distance' then base.dist end asc nulls last,
    base.start_date asc,
    base.id asc
  limit p_limit offset p_offset
$$;

grant execute on function search_events to anon, authenticated;

-- ── 단건 상세 ─────────────────────────────────────────
create or replace function get_event(p_id uuid)
returns table (
  id uuid,
  title text,
  description text,
  category event_category,
  start_date date,
  end_date date,
  start_time time,
  end_time time,
  venue_name text,
  address text,
  road_address text,
  lat double precision,
  lng double precision,
  region_sido text,
  region_sigungu text,
  area_detail text,
  price_type price_type,
  price_min integer,
  price_max integer,
  booking_url text,
  homepage_url text,
  thumbnail_url text,
  images jsonb,
  tags text[],
  status event_status,
  source_url text
)
language sql
stable
as $$
  select
    e.id, e.title, e.description, e.category,
    e.start_date, e.end_date, e.start_time, e.end_time,
    e.venue_name, e.address, e.road_address,
    ST_Y(e.location::geometry), ST_X(e.location::geometry),
    e.region_sido, e.region_sigungu, e.area_detail,
    e.price_type, e.price_min, e.price_max,
    e.booking_url, e.homepage_url, e.thumbnail_url,
    e.images, e.tags, e.status, e.source_url
  from events e
  where e.id = p_id
$$;

grant execute on function get_event to anon, authenticated;
