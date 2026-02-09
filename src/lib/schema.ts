export const DATABASE_SCHEMA = `
-- 고객 테이블 (1,000건)
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  city VARCHAR(50) NOT NULL,        -- 서울, 부산, 인천, 대구, 대전, 광주, 수원, 울산, 창원, 고양, 용인, 성남, 청주, 전주, 천안, 김해, 제주, 포항, 원주, 춘천
  age INTEGER NOT NULL,              -- 18~65
  gender VARCHAR(10) NOT NULL,       -- '남성', '여성'
  joined_at DATE NOT NULL
);

-- 상품 테이블 (50건)
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,    -- 전자기기, 의류, 식품, 도서, 가전, 뷰티, 스포츠, 가구, 완구, 문구
  brand VARCHAR(100) NOT NULL,       -- 삼성, 애플, 나이키, 다이슨 등
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  rating NUMERIC(2,1) NOT NULL,      -- 1.0~5.0
  created_at DATE NOT NULL
);

-- 주문 테이블 (3,000건)
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  customer_id INTEGER REFERENCES customers(id),
  product_id INTEGER REFERENCES products(id),
  quantity INTEGER NOT NULL,
  total_price NUMERIC(10,2) NOT NULL,
  order_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL       -- pending, confirmed, shipped, delivered, cancelled
);
`;

export const FEW_SHOT_EXAMPLES = [
  {
    question: "도시별 고객 수를 알려줘",
    sql: "SELECT city, COUNT(*) as customer_count FROM customers GROUP BY city ORDER BY customer_count DESC",
    chartConfig: {
      chartType: "bar" as const,
      xKey: "city",
      yKey: "customer_count",
      title: "도시별 고객 수",
    },
    explanation:
      "customers 테이블에서 도시별로 그룹화하여 고객 수를 집계했습니다.",
  },
  {
    question: "월별 매출 추이를 보여줘",
    sql: "SELECT TO_CHAR(order_date, 'YYYY-MM') as month, SUM(total_price) as revenue FROM orders WHERE status != 'cancelled' GROUP BY month ORDER BY month",
    chartConfig: {
      chartType: "line" as const,
      xKey: "month",
      yKey: "revenue",
      title: "월별 매출 추이",
    },
    explanation:
      "취소된 주문을 제외하고 월별로 매출을 집계하여 시계열 추이를 보여줍니다.",
  },
  {
    question: "가격이 30달러 미만인 상품 목록",
    sql: "SELECT name, category, brand, price, rating FROM products WHERE price < 30 ORDER BY price",
    chartConfig: null,
    explanation:
      "products 테이블에서 가격이 30달러 미만인 상품을 가격순으로 조회했습니다.",
  },
  {
    question: "연령대별 주문 건수를 보여줘",
    sql: "SELECT CASE WHEN c.age < 20 THEN '10대' WHEN c.age < 30 THEN '20대' WHEN c.age < 40 THEN '30대' WHEN c.age < 50 THEN '40대' WHEN c.age < 60 THEN '50대' ELSE '60대' END as age_group, COUNT(*) as order_count FROM orders o JOIN customers c ON o.customer_id = c.id GROUP BY age_group ORDER BY age_group",
    chartConfig: {
      chartType: "bar" as const,
      xKey: "age_group",
      yKey: "order_count",
      title: "연령대별 주문 건수",
    },
    explanation:
      "고객의 나이를 연령대별로 분류하고, 각 연령대의 주문 건수를 집계했습니다.",
  },
  {
    question: "브랜드별 평균 평점 TOP 10",
    sql: "SELECT brand, ROUND(AVG(rating), 1) as avg_rating FROM products GROUP BY brand ORDER BY avg_rating DESC LIMIT 10",
    chartConfig: {
      chartType: "bar" as const,
      xKey: "brand",
      yKey: "avg_rating",
      title: "브랜드별 평균 평점 TOP 10",
    },
    explanation:
      "상품의 브랜드별 평균 평점을 계산하여 상위 10개를 보여줍니다.",
  },
  {
    question: "성별 매출 비교",
    sql: "SELECT c.gender, SUM(o.total_price) as total_revenue FROM orders o JOIN customers c ON o.customer_id = c.id WHERE o.status != 'cancelled' GROUP BY c.gender",
    chartConfig: {
      chartType: "pie" as const,
      xKey: "gender",
      yKey: "total_revenue",
      title: "성별 매출 비교",
    },
    explanation:
      "취소된 주문을 제외하고 성별로 총 매출을 비교한 결과입니다.",
  },
  {
    question: "카테고리별 매출 순위",
    sql: "SELECT p.category, SUM(o.total_price) as total_revenue FROM orders o JOIN products p ON o.product_id = p.id WHERE o.status != 'cancelled' GROUP BY p.category ORDER BY total_revenue DESC",
    chartConfig: {
      chartType: "bar" as const,
      xKey: "category",
      yKey: "total_revenue",
      title: "카테고리별 매출 순위",
    },
    explanation:
      "취소 주문을 제외하고 상품 카테고리별 총 매출을 내림차순으로 보여줍니다.",
  },
];
