export const DATABASE_SCHEMA = `
-- 고객 테이블
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(200) UNIQUE NOT NULL,
  city VARCHAR(50) NOT NULL,        -- 서울, 부산, 대구, 인천, 광주, 대전
  joined_at DATE NOT NULL
);

-- 상품 테이블
CREATE TABLE products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  category VARCHAR(50) NOT NULL,    -- Electronics, Clothing, Food, Books
  price NUMERIC(10,2) NOT NULL,
  stock INTEGER NOT NULL,
  created_at DATE NOT NULL
);

-- 주문 테이블
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
    sql: "SELECT name, category, price, stock FROM products WHERE price < 30 ORDER BY price",
    chartConfig: null,
    explanation:
      "products 테이블에서 가격이 30달러 미만인 상품을 가격순으로 조회했습니다.",
  },
];
