-- 0004_culture_source.sql — 문화포털(공연전시) 소스 등록
-- 적용: Supabase SQL Editor 에 붙여넣고 Run

insert into sources (id, name, base_url) values
  ('culture', '한국문화정보원 공연전시정보(통합)', 'https://api.kcisa.kr/openapi')
on conflict (id) do nothing;
