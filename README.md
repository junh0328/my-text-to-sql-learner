# Text-to-SQL Learner

자연어를 SQL로 변환하여 데이터를 조회하고 시각화하는 학습용 웹 서비스입니다.

한국어 또는 영어로 질문하면 AI가 SQL 쿼리를 생성하고, Supabase(PostgreSQL)에서 실행한 결과를 테이블과 차트로 보여줍니다.

<img src="./docs/ask_to_db.gif" alt="ask to db landing page"/>

## 주요 기능

- **자연어 → SQL 변환**: Gemini 2.5 Flash가 사용자 질문을 PostgreSQL 쿼리로 변환
- **자동 차트 시각화**: 쿼리 특성에 따라 Bar / Line / Pie 차트를 자동 선택
- **SQL 안전성 검증**: SELECT/WITH만 허용, 위험 키워드 및 다중 statement 차단
- **예시 질문 제공**: 클릭 한 번으로 다양한 쿼리 패턴 체험

## 데모

| 질문                       | 차트 타입 | 설명                |
| -------------------------- | --------- | ------------------- |
| 도시별 고객 수는?          | Bar       | 20개 도시별 비교    |
| 월별 매출 추이 보여줘      | Line      | 시계열 추이         |
| 카테고리별 매출 순위       | Bar       | 10개 카테고리 비교  |
| 연령대별 주문 현황         | Bar       | age 컬럼 활용       |
| 성별 구매 금액 비교        | Pie       | gender 컬럼 활용    |
| 브랜드별 평균 평점         | Bar       | brand + rating 활용 |
| 가장 많이 팔린 상품 TOP 10 | Bar       | 순위 비교           |
| 주문 상태별 비율은?        | Pie       | 비율/구성           |

## 아키텍처

```
사용자
    │
    ├─ 첫 방문 시 API Key 입력 다이얼로그
    │  (Google AI Studio에서 무료 발급)
    │  → localStorage에 저장
    │
    ├─ 자연어 질문 입력
    │
    ▼
┌─────────────────────────────────────────────┐
│  Client (React)                             │
│  API Key + 질문 → Server Action 호출        │
│  결과 렌더링: SqlViewer / ChartView / Table  │
└──────────────────┬──────────────────────────┘
                   │ Server Action
                   ▼
┌─────────────────────────────────────────────┐
│  Server (Next.js)                           │
│  1. 사용자 API Key로 Gemini 호출            │
│  2. SQL 안전성 검증 (SELECT/WITH만 허용)     │
│  3. Supabase RPC로 SQL 실행 (anon + RLS)    │
│  4. QueryResult 반환                        │
└─────────────────────────────────────────────┘
```

- **서버**: AI 호출, SQL 검증, DB 실행 모두 Server Action에서 처리
- **클라이언트**: API Key 관리 (localStorage) + 결과 렌더링
- **DB 보안**: anon key + RLS로 SELECT만 허용, 시스템 테이블 접근 차단

## 기술 스택

| 영역          | 기술                                                       |
| ------------- | ---------------------------------------------------------- |
| 프레임워크    | Next.js 16 + React 19 + TypeScript 5                       |
| 스타일링      | Tailwind CSS v4 + shadcn/ui                                |
| AI            | Vercel AI SDK (`ai` + `@ai-sdk/google`) + Gemini 2.5 Flash |
| DB            | Supabase (PostgreSQL)                                      |
| 차트          | Recharts 3.x                                               |
| 숫자 처리     | bignumber.js                                               |
| 검증          | Zod (AI 응답 구조화)                                       |
| 테스트        | vitest (단위) + Playwright MCP (E2E)                       |
| 패키지 매니저 | pnpm                                                       |

## 시작하기

### 1. 저장소 클론 및 의존성 설치

```bash
git clone <repository-url>
cd my-text-to-sql-learner
pnpm install
```

### 2. 환경변수 설정

```bash
cp .env.example .env.local
```

`.env.local` 파일을 열고 Supabase 정보를 입력합니다:

```env
# Supabase 대시보드 > Settings > API 에서 확인
SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
SUPABASE_ANON_KEY=eyJhbGci...YOUR_ANON_KEY
```

> Google AI API key는 서버 환경변수로 설정하지 않습니다.
> 사용자가 브라우저에서 직접 입력하는 방식입니다.

### 3. Supabase 데이터베이스 설정

1. [supabase.com](https://supabase.com)에서 새 프로젝트 생성
2. SQL Editor에서 `supabase/seed.sql` 전체 내용을 복사-붙여넣기 후 실행 (RLS 정책 포함)
3. Settings > API에서 **Project URL**과 **anon key**를 복사하여 `.env.local`에 입력

### 4. 개발 서버 실행

```bash
pnpm dev
```

[http://localhost:3000](http://localhost:3000)에서 확인할 수 있습니다.

## 데이터베이스 스키마

이커머스 더미데이터 3개 테이블로 다양한 쿼리 패턴을 학습할 수 있습니다:

```sql
-- 고객 (1,000건): 20개 도시, 연령 18~65세, 성별
customers (id, name, email, city, age, gender, joined_at)

-- 상품 (50건): 10개 카테고리, 브랜드, 평점 1.0~5.0
products (id, name, category, brand, price, stock, rating, created_at)

-- 주문 (3,000건): 5개 상태 (pending, confirmed, shipped, delivered, cancelled)
orders (id, customer_id FK, product_id FK, quantity, total_price, order_date, status)
```

상품은 정적 INSERT, 고객/주문은 PostgreSQL `generate_series`로 동적 생성됩니다.

## 프로젝트 구조

```
src/
  app/
    layout.tsx             # 레이아웃 (lang="ko", 메타데이터)
    page.tsx               # 메인 페이지 (Client Component)
    actions.ts             # Server Action (AI → 검증 → DB 실행)
  components/
    ui/                    # shadcn/ui 컴포넌트
    query-container.tsx    # 메인 컨테이너 (API key 통합)
    api-key-dialog.tsx     # API key 입력 다이얼로그
    query-input.tsx        # 텍스트 입력 + 예시 질문 버튼
    sql-viewer.tsx         # 생성된 SQL + 설명 표시
    results-table.tsx      # 쿼리 결과 테이블
    chart-view.tsx         # Recharts 차트 (bar/line/pie)
    error-message.tsx      # 에러 표시
    result-skeleton.tsx    # 로딩 스켈레톤
  hooks/
    use-api-key.ts         # localStorage API key 관리
  lib/
    ai.ts                  # Gemini 프롬프트 + generateText 호출
    supabase.ts            # Supabase 서버 클라이언트 (anon key)
    schema.ts              # DDL 스키마 + few-shot 예시
    validate-sql.ts        # SQL 안전성 검증
    __tests__/
      validate-sql.test.ts # SQL 검증 단위 테스트 (14 케이스)
  types/
    index.ts               # 공유 타입 (QueryResult, ChartConfig)
supabase/
  seed.sql                 # 테이블 생성 + 더미데이터 + execute_sql RPC
```

## 스크립트

```bash
pnpm dev            # 개발 서버 실행
pnpm build          # 프로덕션 빌드
pnpm tsc --noEmit   # 타입 체크
pnpm vitest run     # 단위 테스트 실행
```

## 보안

- **Supabase**: anon key + RLS(Row Level Security)로 보호
  - 3개 테이블에 SELECT 전용 정책 적용
  - `execute_sql` RPC는 `SECURITY INVOKER` — anon 권한으로 실행, RLS 적용
  - 시스템 테이블 및 데이터 변경 차단
- **Google AI API Key**: 사용자 브라우저 localStorage에만 저장
  - 서버에 영구 저장되지 않음
  - Server Action 호출 시 일회성으로 전달

## 주의사항

- Recharts SVG는 CSS 변수를 해석하지 못하므로 고정 HEX 색상 팔레트를 사용합니다.
- Supabase의 NUMERIC 컬럼은 문자열로 반환되므로 bignumber.js로 소수점 2자리 버림 처리합니다.
