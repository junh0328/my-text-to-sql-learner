-- ============================================
-- Text-to-SQL Learner: 이커머스 더미데이터
-- Supabase SQL Editor에서 이 파일 전체를 실행하세요.
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
  joined_at DATE NOT NULL
);

CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL,
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
-- 2. 더미데이터 삽입
-- ============================================

-- 고객 15건 (6개 도시)
INSERT INTO customers (name, email, city, joined_at) VALUES
  ('김민수', 'minsu.kim@email.com', '서울', '2024-01-15'),
  ('이영희', 'younghee.lee@email.com', '부산', '2024-02-20'),
  ('박지훈', 'jihoon.park@email.com', '서울', '2024-03-10'),
  ('최수진', 'sujin.choi@email.com', '대구', '2024-01-25'),
  ('정다은', 'daeun.jung@email.com', '인천', '2024-04-05'),
  ('강현우', 'hyunwoo.kang@email.com', '광주', '2024-02-14'),
  ('윤서연', 'seoyeon.yoon@email.com', '대전', '2024-05-01'),
  ('임재현', 'jaehyun.lim@email.com', '서울', '2024-03-22'),
  ('한소희', 'sohee.han@email.com', '부산', '2024-06-10'),
  ('오준영', 'junyoung.oh@email.com', '대구', '2024-04-18'),
  ('신예린', 'yerin.shin@email.com', '인천', '2024-07-03'),
  ('홍길동', 'gildong.hong@email.com', '서울', '2024-05-28'),
  ('장미란', 'miran.jang@email.com', '광주', '2024-08-15'),
  ('배성호', 'sungho.bae@email.com', '대전', '2024-06-20'),
  ('문하늘', 'haneul.moon@email.com', '부산', '2024-09-01');

-- 상품 12건 (4개 카테고리)
INSERT INTO products (name, category, price, stock, created_at) VALUES
  ('무선 블루투스 이어폰', 'Electronics', 45.99, 150, '2024-01-01'),
  ('스마트 워치 Pro', 'Electronics', 199.99, 80, '2024-01-15'),
  ('USB-C 충전 케이블', 'Electronics', 12.99, 500, '2024-02-01'),
  ('오가닉 면 티셔츠', 'Clothing', 25.99, 200, '2024-01-10'),
  ('데님 청바지', 'Clothing', 59.99, 120, '2024-02-15'),
  ('겨울 패딩 자켓', 'Clothing', 129.99, 60, '2024-03-01'),
  ('유기농 그래놀라', 'Food', 8.99, 300, '2024-01-20'),
  ('프리미엄 원두커피', 'Food', 15.99, 250, '2024-02-10'),
  ('수제 초콜릿 세트', 'Food', 22.99, 100, '2024-03-15'),
  ('TypeScript 입문서', 'Books', 29.99, 90, '2024-01-05'),
  ('데이터베이스 설계 가이드', 'Books', 35.99, 70, '2024-02-20'),
  ('AI 프로그래밍 실전', 'Books', 42.99, 50, '2024-03-10');

-- 주문 30건 (5가지 상태)
INSERT INTO orders (customer_id, product_id, quantity, total_price, order_date, status) VALUES
  (1, 1, 2, 91.98, '2024-03-01', 'delivered'),
  (2, 4, 1, 25.99, '2024-03-05', 'delivered'),
  (3, 2, 1, 199.99, '2024-03-10', 'delivered'),
  (4, 7, 3, 26.97, '2024-03-15', 'delivered'),
  (5, 10, 1, 29.99, '2024-03-20', 'delivered'),
  (6, 5, 2, 119.98, '2024-04-01', 'delivered'),
  (7, 8, 1, 15.99, '2024-04-05', 'delivered'),
  (8, 3, 5, 64.95, '2024-04-10', 'shipped'),
  (9, 6, 1, 129.99, '2024-04-15', 'shipped'),
  (10, 11, 1, 35.99, '2024-04-20', 'shipped'),
  (1, 9, 2, 45.98, '2024-05-01', 'confirmed'),
  (2, 12, 1, 42.99, '2024-05-05', 'confirmed'),
  (3, 1, 1, 45.99, '2024-05-10', 'confirmed'),
  (11, 4, 3, 77.97, '2024-05-15', 'pending'),
  (12, 2, 1, 199.99, '2024-05-20', 'pending'),
  (13, 7, 2, 17.98, '2024-05-25', 'pending'),
  (14, 8, 4, 63.96, '2024-06-01', 'pending'),
  (15, 5, 1, 59.99, '2024-06-05', 'cancelled'),
  (1, 10, 2, 59.98, '2024-06-10', 'delivered'),
  (4, 3, 3, 38.97, '2024-06-15', 'delivered'),
  (6, 12, 1, 42.99, '2024-06-20', 'shipped'),
  (8, 6, 1, 129.99, '2024-07-01', 'confirmed'),
  (2, 9, 1, 22.99, '2024-07-05', 'pending'),
  (5, 11, 2, 71.98, '2024-07-10', 'delivered'),
  (7, 1, 3, 137.97, '2024-07-15', 'shipped'),
  (9, 4, 2, 51.98, '2024-07-20', 'confirmed'),
  (10, 8, 2, 31.98, '2024-08-01', 'pending'),
  (3, 5, 1, 59.99, '2024-08-05', 'cancelled'),
  (11, 2, 1, 199.99, '2024-08-10', 'confirmed'),
  (12, 7, 5, 44.95, '2024-08-15', 'pending');

-- ============================================
-- 3. execute_sql RPC 함수 (학습용)
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
