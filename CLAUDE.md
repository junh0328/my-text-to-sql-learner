# Text-to-SQL Learner

## 프로젝트 개요
자연어를 SQL로 변환하여 데이터를 조회하고 시각화하는 학습용 서비스.

## 기술 스택
- Next.js 16 + React 19 + TypeScript 5 + Tailwind CSS v4
- **UI**: shadcn/ui (Tailwind 기반 컴포넌트) — shadcn MCP 활용
- Vercel AI SDK (`ai` + `@ai-sdk/google`) + Gemini 2.5 Flash
- Supabase (PostgreSQL) — 서버사이드 전용 (service role key)
- Recharts 3.x — 차트 시각화 (고정 HEX 색상 팔레트, CSS 변수 미사용)
- bignumber.js — 숫자 소수점 2자리 버림 처리
- Zod — AI 응답 구조화
- **테스트**: vitest (단위 테스트) + Playwright (E2E 테스트, Playwright MCP 활용)

## MCP 설정
프로젝트 루트 `.mcp.json`에 설정됨:
- **shadcn**: `npx shadcn@latest mcp` — shadcn/ui 컴포넌트 설치/관리
- **playwright**: `npx @playwright/mcp@latest` — E2E 테스트 브라우저 제어

## 핵심 아키텍처
- Server Action (`src/app/actions.ts`)이 전체 흐름 조율
- AI 호출 → SQL 검증 → DB 실행 → 결과 반환 모두 서버사이드
- 클라이언트는 결과 렌더링만 담당 (테이블 + 차트)

## 주요 규칙
- `SUPABASE_SERVICE_ROLE_KEY`는 절대 클라이언트에 노출하지 않음
- SQL 실행 전 반드시 `validateSQL()`로 SELECT 여부 검증
- `execute_sql` RPC 함수는 학습용 — 프로덕션에서는 read-only DB role 사용 필요
- AI SDK의 `generateText` + `Output.object()` 패턴 사용 (deprecated `generateObject` 사용 금지)
- UI 컴포넌트는 shadcn/ui 사용 — shadcn MCP로 설치

## 데이터베이스
- 3개 테이블: customers(15건), products(12건), orders(30건)
- 스키마 정의: `src/lib/schema.ts`
- 시드 데이터: `supabase/seed.sql`

## 환경변수 (.env.local)
- `SUPABASE_URL` — Supabase 프로젝트 URL
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase service role key
- `GOOGLE_GENERATIVE_AI_API_KEY` — Google AI Studio API key

## 패키지 매니저
- **pnpm** 사용 (npm 대신)

## 개발
```bash
pnpm dev         # 개발 서버
pnpm build       # 빌드
pnpm tsc --noEmit # 타입 체크
```

---

## 단계별 구현 가이드

> 각 단계 완료 시 아래 프로세스를 따른다:
> 1. 유저에게 작업 내용을 알린다
> 2. `pnpm tsc --noEmit` (타입 체크) + `pnpm build` (빌드) 실행
> 3. 필요한 경우 테스트 코드 작성 후 테스트 통과 확인
> 4. 유저 승인 후 다음 단계로 진행

### Step 1: 의존성 설치 + shadcn/ui 초기화
**작업 내용:**
- `pnpm add ai @ai-sdk/google @supabase/supabase-js recharts zod bignumber.js`
- `package.json`에 `pnpm.overrides: { "react-is": "$react" }` 추가 (Recharts + React 19 호환)
- shadcn/ui 초기화 (`pnpm dlx shadcn@latest init`)
- 필요한 shadcn/ui 컴포넌트 설치 (button, input, card, table, badge 등)

**검증:** `pnpm build` 성공

**생성/수정 파일:**
- `package.json` (수정)
- `components.json` (shadcn 설정)
- `src/components/ui/*` (shadcn 컴포넌트)

---

### Step 2: 기초 파일 생성 — 타입 정의 + 환경변수
**작업 내용:**
- `src/types/index.ts` — 공유 타입 정의 (`QueryResult`, `ChartConfig`)
- `.env.local` — 환경변수 플레이스홀더 생성
- `.env.example` — 환경변수 설정 가이드 (git 커밋용)
- `.gitignore` 수정 — `.env*` → `.env.local`로 변경하여 `.env.example` 커밋 허용

**검증:** `pnpm tsc --noEmit` 통과

**생성 파일:**
- `src/types/index.ts`
- `.env.local`
- `.env.example`

**핵심 타입:**
```typescript
interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'none';
  xKey: string;
  yKey: string;
  title: string;
}

interface QueryResult {
  success: boolean;
  sql: string;
  rows: Record<string, unknown>[];
  columns: string[];
  chartConfig: ChartConfig | null;
  explanation: string;
  error?: string;
}
```

---

### Step 3: DB 관련 파일 생성 — Supabase 클라이언트 + Seed SQL
**작업 내용:**
- `src/lib/supabase.ts` — Supabase 서버 클라이언트 (service role key)
- `supabase/seed.sql` — 테이블 생성 + 더미데이터 + `execute_sql` RPC 함수
- `src/lib/schema.ts` — DDL 스키마 문자열 + few-shot 예시 (AI 프롬프트용)

**검증:** `pnpm tsc --noEmit` 통과

**생성 파일:**
- `src/lib/supabase.ts`
- `src/lib/schema.ts`
- `supabase/seed.sql`

**DB 테이블:**
- `customers` (15건): id, name, email, city, joined_at
- `products` (12건): id, name, category, price, stock, created_at
- `orders` (30건): id, customer_id(FK), product_id(FK), quantity, total_price, order_date, status

---

### Step 4: SQL 검증 모듈
**작업 내용:**
- `src/lib/validate-sql.ts` — SQL 안전성 검증

**검증 규칙:**
- SELECT 또는 WITH으로 시작하는지 확인
- 위험 키워드 차단: INSERT, UPDATE, DELETE, DROP, ALTER, TRUNCATE, CREATE
- 다중 statement 차단 (세미콜론 중간 위치 거부)

**검증:** `pnpm tsc --noEmit` 통과 + vitest 테스트 코드 작성 (`pnpm vitest run`)
- `pnpm add -D vitest` 설치 필요

**생성 파일:**
- `src/lib/validate-sql.ts`
- `src/lib/__tests__/validate-sql.test.ts`

**테스트 케이스:**
- `SELECT * FROM users` → 통과
- `WITH cte AS (...) SELECT ...` → 통과
- `DROP TABLE users` → 차단
- `SELECT 1; DROP TABLE users` → 차단
- `INSERT INTO users ...` → 차단

---

### Step 5: AI 모듈
**작업 내용:**
- `src/lib/ai.ts` — Gemini 프롬프트 구성 + `generateText` + `Output.object()` 호출

**핵심 구현:**
- System prompt에 DDL 스키마 + few-shot 예시 포함
- Zod 스키마로 구조화된 출력: `{ sql, chartConfig, explanation }`
- 모델: `gemini-2.5-flash`
- 한국어/영어 모두 처리
- "결과가 많을 경우 LIMIT 50 추가" 규칙 포함

**검증:** `pnpm tsc --noEmit` 통과

**생성 파일:**
- `src/lib/ai.ts`

---

### Step 6: Server Action
**작업 내용:**
- `src/app/actions.ts` — 전체 흐름 조율 (AI 호출 → SQL 검증 → DB 실행)

**흐름:**
1. 유저 자연어 입력 받기
2. `generateSqlQuery()` (AI 호출)
3. `validateSQL()` (안전성 검증)
4. Supabase `execute_sql` RPC 호출
5. `QueryResult` 반환

**검증:** `pnpm tsc --noEmit` 통과

**생성 파일:**
- `src/app/actions.ts`

---

### Step 7: UI 컴포넌트 (5개) — shadcn/ui 기반
**작업 내용:**
- `src/components/query-input.tsx` — 텍스트 입력 + 예시 질문 버튼 (shadcn Button, Input 사용)
- `src/components/sql-viewer.tsx` — 생성된 SQL + 설명 표시 (shadcn Card 사용)
- `src/components/results-table.tsx` — 쿼리 결과 테이블 (shadcn Table 사용)
- `src/components/chart-view.tsx` — Recharts 차트 (bar/line/pie 동적 전환, shadcn Card 래핑, bignumber.js로 소수점 처리)
- `src/components/error-message.tsx` — 에러 표시 (shadcn Alert 사용)

**모두 `"use client"` 컴포넌트, shadcn/ui 컴포넌트 활용**

**검증:** `pnpm tsc --noEmit` 통과

**생성 파일:**
- `src/components/query-input.tsx`
- `src/components/sql-viewer.tsx`
- `src/components/results-table.tsx`
- `src/components/chart-view.tsx`
- `src/components/error-message.tsx`

---

### Step 8: 메인 페이지 + 레이아웃 수정
**작업 내용:**
- `src/app/page.tsx` — 메인 UI로 교체 (Client Component, 컴포넌트 조합)
- `src/app/layout.tsx` — 메타데이터 수정 (title, description, lang="ko")

**검증:** `pnpm tsc --noEmit` + `pnpm build` 통과

**수정 파일:**
- `src/app/page.tsx` (교체)
- `src/app/layout.tsx` (수정)

---

### Step 9: Supabase 설정 (유저 직접 수행)
**유저가 직접 수행하는 단계:**
1. [supabase.com](https://supabase.com) 가입 → 새 프로젝트 생성
2. SQL Editor에서 `supabase/seed.sql` 전체 내용 복사-붙여넣기 → Run
3. Settings > API에서 Project URL과 service_role key 복사
4. `.env.local`에 실제 값 입력
5. [Google AI Studio](https://aistudio.google.com/apikey)에서 API key 발급 → `.env.local`에 입력

---

### Step 10: E2E 테스트 — Playwright MCP 활용
**작업 내용:**
- Playwright 설치 및 설정
- Playwright MCP를 활용하여 E2E 테스트 실행

**테스트 시나리오:**
1. "도시별 고객 수는?" → bar 차트 + 테이블 렌더링 확인
2. "월별 매출 추이 보여줘" → line 차트 + 테이블 렌더링 확인
3. "30달러 미만 상품 목록" → 테이블만 표시 확인
4. "주문 상태별 비율은?" → pie 차트 + 테이블 렌더링 확인
5. "가장 많이 팔린 상품 TOP 5" → bar 차트 + 테이블 렌더링 확인

**검증:** Playwright 테스트 전체 통과

---

## 파일 구조 (최종)

```
src/
  app/
    layout.tsx           ← Step 8 (메타데이터 수정)
    page.tsx             ← Step 8 (메인 UI 교체)
    actions.ts           ← Step 6
  components/
    ui/                  ← Step 1 (shadcn/ui 컴포넌트)
      button.tsx
      input.tsx
      card.tsx
      table.tsx
      badge.tsx
      alert.tsx
      ...
    query-input.tsx      ← Step 7
    sql-viewer.tsx       ← Step 7
    results-table.tsx    ← Step 7
    chart-view.tsx       ← Step 7
    error-message.tsx    ← Step 7
  lib/
    utils.ts             ← Step 1 (shadcn/ui 유틸)
    supabase.ts          ← Step 3
    schema.ts            ← Step 3
    ai.ts                ← Step 5
    validate-sql.ts      ← Step 4
    __tests__/
      validate-sql.test.ts ← Step 4
  types/
    index.ts             ← Step 2
supabase/
  seed.sql               ← Step 3
.env.local               ← Step 2 (git 제외)
.env.example             ← Step 2 (환경변수 가이드, git 포함)
.mcp.json                ← MCP 설정 (shadcn, playwright)
pnpm-workspace.yaml      ← pnpm 워크스페이스 설정
CLAUDE.md                ← 이 파일
```

## 주의사항
- `SUPABASE_SERVICE_ROLE_KEY`는 서버사이드(Server Action)에서만 사용 — 클라이언트에 노출 금지
- Recharts는 SSR 미지원 → `"use client"` 필수
- Recharts SVG는 CSS 변수(`hsl(var(...))`)를 해석 못함 → 고정 HEX 색상 팔레트 사용
- Supabase의 NUMERIC 컬럼은 문자열로 반환 → ChartView에서 `BigNumber().decimalPlaces(2, ROUND_DOWN).toNumber()` 처리
- `execute_sql` RPC 함수는 학습용으로만 사용
- 한국어 입력 시 AI가 한국어로 explanation 반환하도록 프롬프트에 명시
- shadcn/ui 컴포넌트 설치 시 shadcn MCP 활용
- E2E 테스트는 Playwright MCP로 브라우저 제어하여 실행
