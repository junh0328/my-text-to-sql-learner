-- ============================================
-- Text-to-SQL Learner: 이커머스 더미데이터
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요.
-- 고객 1,000명 / 상품 50개 / 주문 3,000건
-- ============================================

-- 기존 테이블 삭제 (재실행 대비)
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS products CASCADE;
DROP TABLE IF EXISTS customers CASCADE;

-- ============================================
-- 1. 테이블 생성
-- ============================================

CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  city VARCHAR(50) NOT NULL,
  age INTEGER NOT NULL,
  gender VARCHAR(10) NOT NULL,
  joined_at DATE NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  rating NUMERIC(2,1) NOT NULL,
  created_at DATE NOT NULL
);

CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  order_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL
);

-- ============================================
-- 2. 상품 50개 (10개 카테고리 x 5개)
-- ============================================

INSERT INTO products (name, category, brand, price, stock, rating, created_at) VALUES
  -- 전자기기
  ('블루투스 이어폰', '전자기기', '삼성', 49.99, 300, 4.3, '2023-01-10'),
  ('스마트 워치 Pro', '전자기기', '애플', 299.99, 120, 4.7, '2023-02-15'),
  ('USB-C 고속 충전기', '전자기기', '앤커', 24.99, 500, 4.5, '2023-03-01'),
  ('노이즈캔슬링 헤드폰', '전자기기', '소니', 199.99, 80, 4.6, '2023-04-10'),
  ('보조배터리 20000mAh', '전자기기', '샤오미', 29.99, 400, 4.2, '2023-05-20'),
  -- 의류
  ('면 티셔츠', '의류', '유니클로', 19.99, 600, 4.1, '2023-01-15'),
  ('슬림핏 청바지', '의류', '리바이스', 69.99, 200, 4.4, '2023-02-20'),
  ('경량 패딩 자켓', '의류', '노스페이스', 149.99, 100, 4.5, '2023-03-10'),
  ('캐시미어 니트', '의류', '무인양품', 59.99, 150, 4.3, '2023-04-05'),
  ('트레이닝 팬츠', '의류', '나이키', 44.99, 250, 4.2, '2023-05-15'),
  -- 식품
  ('오트밀 그래놀라', '식품', '네이처밸리', 7.99, 800, 4.0, '2023-01-20'),
  ('싱글오리진 원두커피', '식품', '스타벅스', 14.99, 500, 4.4, '2023-02-25'),
  ('다크 초콜릿 세트', '식품', '고디바', 29.99, 200, 4.6, '2023-03-15'),
  ('프리미엄 견과믹스', '식품', '허니버터', 12.99, 400, 4.2, '2023-04-20'),
  ('유기농 콤부차', '식품', '티젠', 9.99, 350, 3.9, '2023-05-25'),
  -- 도서
  ('TypeScript 입문서', '도서', '한빛미디어', 29.99, 150, 4.5, '2023-01-05'),
  ('DB 설계 완벽 가이드', '도서', '위키북스', 35.99, 100, 4.3, '2023-02-10'),
  ('AI 프로그래밍 실전', '도서', '길벗', 42.99, 80, 4.4, '2023-03-20'),
  ('클린 코드', '도서', '인사이트', 32.99, 120, 4.7, '2023-04-15'),
  ('경제학 에센셜', '도서', '웅진지식', 27.99, 90, 4.1, '2023-05-10'),
  -- 가전
  ('무선 청소기 V15', '가전', '다이슨', 499.99, 50, 4.6, '2023-01-25'),
  ('디지털 에어프라이어', '가전', '필립스', 89.99, 150, 4.3, '2023-02-28'),
  ('초음파 가습기', '가전', '샤오미', 39.99, 200, 4.1, '2023-03-25'),
  ('음파 전동칫솔', '가전', '오랄비', 59.99, 300, 4.4, '2023-04-25'),
  ('공기청정기', '가전', 'LG', 249.99, 70, 4.5, '2023-05-30'),
  -- 뷰티
  ('수분 크림', '뷰티', '이니스프리', 18.99, 400, 4.2, '2023-01-12'),
  ('워터리 선크림 SPF50', '뷰티', '비오레', 12.99, 500, 4.4, '2023-02-18'),
  ('클렌징 밤', '뷰티', '바닐라코', 15.99, 350, 4.5, '2023-03-22'),
  ('벨벳 립틴트', '뷰티', '롬앤', 9.99, 600, 4.3, '2023-04-28'),
  ('헤어 에센스 오일', '뷰티', '미장센', 11.99, 300, 4.1, '2023-05-18'),
  -- 스포츠
  ('에어줌 러닝화', '스포츠', '나이키', 129.99, 180, 4.5, '2023-01-30'),
  ('프로 요가매트 6mm', '스포츠', '만두카', 79.99, 120, 4.6, '2023-02-22'),
  ('하이브리드 자전거', '스포츠', '삼천리', 349.99, 30, 4.2, '2023-03-28'),
  ('등산 배낭 40L', '스포츠', '그레고리', 159.99, 60, 4.4, '2023-04-30'),
  ('스텐리스 물병 1L', '스포츠', '스탠리', 34.99, 400, 4.3, '2023-05-22'),
  -- 가구
  ('높이조절 전동 책상', '가구', '이케아', 399.99, 40, 4.4, '2023-01-18'),
  ('인체공학 사무의자', '가구', '시디즈', 349.99, 50, 4.5, '2023-02-24'),
  ('5단 오픈 책장', '가구', '한샘', 129.99, 70, 4.2, '2023-03-30'),
  ('LED 데스크 조명', '가구', '필립스', 49.99, 200, 4.3, '2023-04-22'),
  ('접이식 사이드 테이블', '가구', '코스트코', 69.99, 100, 4.0, '2023-05-28'),
  -- 완구
  ('레고 크리에이터 세트', '완구', '레고', 79.99, 150, 4.7, '2023-01-22'),
  ('전략 보드게임', '완구', '코리아보드', 34.99, 200, 4.3, '2023-02-26'),
  ('RC카 오프로드', '완구', '타미야', 54.99, 100, 4.2, '2023-03-18'),
  ('3D 퍼즐 1000피스', '완구', '라벤스부르거', 24.99, 180, 4.4, '2023-04-18'),
  ('건담 프라모델 MG', '완구', '반다이', 44.99, 120, 4.6, '2023-05-26'),
  -- 문구
  ('사파리 만년필', '문구', '라미', 39.99, 150, 4.5, '2023-01-28'),
  ('2025 다이어리', '문구', '모닝글로리', 12.99, 300, 4.1, '2023-02-14'),
  ('수채 색연필 36색', '문구', '파버카스텔', 29.99, 200, 4.4, '2023-03-12'),
  ('슈퍼 스티키노트 팩', '문구', '포스트잇', 8.99, 500, 4.2, '2023-04-14'),
  ('데스크 오거나이저', '문구', '무인양품', 19.99, 250, 4.3, '2023-05-12');

-- ============================================
-- 3. 고객 1,000명 (동적 생성)
-- ============================================

INSERT INTO customers (name, email, city, age, gender, joined_at)
SELECT
  surnames[1 + floor(random() * 20)::int] || firstnames[1 + floor(random() * 30)::int] AS name,
  'user' || i || '@email.com' AS email,
  CASE
    WHEN city_rand < 0.20 THEN '서울'
    WHEN city_rand < 0.28 THEN '부산'
    WHEN city_rand < 0.35 THEN '인천'
    WHEN city_rand < 0.41 THEN '대구'
    WHEN city_rand < 0.47 THEN '대전'
    WHEN city_rand < 0.53 THEN '광주'
    WHEN city_rand < 0.57 THEN '수원'
    WHEN city_rand < 0.61 THEN '울산'
    WHEN city_rand < 0.65 THEN '창원'
    WHEN city_rand < 0.69 THEN '고양'
    WHEN city_rand < 0.73 THEN '용인'
    WHEN city_rand < 0.77 THEN '성남'
    WHEN city_rand < 0.80 THEN '청주'
    WHEN city_rand < 0.83 THEN '전주'
    WHEN city_rand < 0.86 THEN '천안'
    WHEN city_rand < 0.89 THEN '김해'
    WHEN city_rand < 0.92 THEN '제주'
    WHEN city_rand < 0.95 THEN '포항'
    WHEN city_rand < 0.98 THEN '원주'
    ELSE '춘천'
  END AS city,
  least(greatest(18, round(35 + 10 * (random() + random() + random() - 1.5))::int), 65) AS age,
  CASE WHEN random() < 0.5 THEN '남성' ELSE '여성' END AS gender,
  DATE '2023-01-01' + floor(random() * 1095)::int AS joined_at
FROM (
  SELECT i, random() AS city_rand
  FROM generate_series(1, 1000) AS i
) sub
CROSS JOIN (
  SELECT
    ARRAY['김','이','박','최','정','강','조','윤','장','임','한','오','서','신','권','황','안','송','류','홍'] AS surnames,
    ARRAY['민수','영희','지훈','수진','다은','현우','서연','재현','소희','준영','예린','길동','미란','성호','하늘','지원','태현','유진','동현','서윤','지민','하은','시우','도윤','은서','수아','지호','연우','서준','하린'] AS firstnames
) arrays;

-- ============================================
-- 4. 주문 3,000건 (동적 생성)
-- ============================================

INSERT INTO orders (customer_id, product_id, quantity, total_price, order_date, status)
SELECT
  gen.cid,
  gen.pid,
  gen.qty,
  ROUND((p.price * gen.qty)::numeric, 2) AS total_price,
  DATE '2023-06-01' + floor(random() * 940)::int AS order_date,
  CASE
    WHEN gen.status_rand < 0.45 THEN 'delivered'
    WHEN gen.status_rand < 0.60 THEN 'shipped'
    WHEN gen.status_rand < 0.75 THEN 'confirmed'
    WHEN gen.status_rand < 0.90 THEN 'pending'
    ELSE 'cancelled'
  END AS status
FROM (
  SELECT
    1 + floor(random() * 1000)::int AS cid,
    1 + floor(random() * 50)::int AS pid,
    1 + floor(random() * 5)::int AS qty,
    random() AS status_rand
  FROM generate_series(1, 3000)
) gen
JOIN products p ON p.id = gen.pid;

-- ============================================
-- 5. execute_sql RPC 함수 (학습용)
-- ============================================
-- 주의: 프로덕션에서는 사용 금지. read-only DB role 사용 필요.

CREATE OR REPLACE FUNCTION execute_sql(query_text TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  result JSON;
BEGIN
  EXECUTE 'SELECT json_agg(row_to_json(t)) FROM (' || query_text || ') t' INTO result;
  RETURN COALESCE(result, '[]'::JSON);
END;
$$;
