-- 0003_seed_dev.sql — 개발용 더미 이벤트 (UI 개발/미리보기용)
-- 적용: Supabase SQL Editor 에 붙여넣고 Run. 운영 전환 시 삭제해도 됨.
--   삭제: delete from events where external_id like 'seed-%';

insert into events
  (source_id, external_id, title, category, start_date, end_date,
   venue_name, address, location, region_sido, region_sigungu, area_detail,
   price_type, tags, content_hash)
values
  ('seoul','seed-1','성수동 글래스 브랜드 팝업스토어','popup','2026-06-01','2026-06-20','에스팩토리','서울 성동구 성수이로 87','SRID=4326;POINT(127.0557 37.5447)','서울특별시','성동구','성수','free','{"팝업","성수"}','seed-1'),
  ('seoul','seed-2','홍대 일러스트레이션 기획전','exhibition','2026-06-03','2026-06-30','KT&G 상상마당','서울 마포구 어울마당로 65','SRID=4326;POINT(126.9236 37.5563)','서울특별시','마포구','홍대','paid','{"전시","홍대"}','seed-2'),
  ('seoul','seed-3','강남 심야 재즈 콘서트','concert','2026-06-10','2026-06-10','무브홀','서울 강남구 봉은사로','SRID=4326;POINT(127.0276 37.4979)','서울특별시','강남구',null,'paid','{"콘서트","재즈"}','seed-3'),
  ('seoul','seed-4','대학로 연극: 한여름밤의 꿈','performance','2026-05-20','2026-06-25','대학로예술극장','서울 종로구 동숭길','SRID=4326;POINT(127.0016 37.5828)','서울특별시','종로구',null,'paid','{"연극","대학로"}','seed-4'),
  ('tourapi','seed-5','부산 해운대 바다축제','festival','2026-06-05','2026-06-12','해운대해수욕장','부산 해운대구','SRID=4326;POINT(129.1604 35.1587)','부산광역시','해운대구',null,'free','{"축제","바다"}','seed-5'),
  ('tourapi','seed-6','제주 유채꽃 페스티벌','festival','2026-06-01','2026-06-08','제주 녹산로','제주 서귀포시','SRID=4326;POINT(126.5312 33.4996)','제주특별자치도','서귀포시',null,'free','{"축제","꽃"}','seed-6'),
  ('seoul','seed-7','한남동 컨템포러리 아트 팝업','popup','2026-06-06','2026-06-15','블루스퀘어','서울 용산구 이태원로','SRID=4326;POINT(126.9947 37.5347)','서울특별시','용산구','한남','free','{"팝업","한남","아트"}','seed-7'),
  ('tourapi','seed-8','수원 화성 문화제','festival','2026-06-12','2026-06-14','수원화성','경기 수원시 팔달구','SRID=4326;POINT(127.0286 37.2636)','경기도','수원시',null,'free','{"축제","역사"}','seed-8'),
  ('seoul','seed-9','강남 스타트업 네트워킹 나이트','academic','2026-06-09','2026-06-09','마루180','서울 강남구 역삼로','SRID=4326;POINT(127.0356 37.4995)','서울특별시','강남구',null,'free','{"네트워킹","스타트업"}','seed-9'),
  ('tourapi','seed-10','대구 국제 뮤지컬 갈라','performance','2026-06-15','2026-06-22','대구오페라하우스','대구 북구 호암로','SRID=4326;POINT(128.6014 35.8714)','대구광역시','북구',null,'paid','{"뮤지컬","공연"}','seed-10')
on conflict (source_id, external_id) do nothing;
