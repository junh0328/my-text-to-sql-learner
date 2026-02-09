# Text-to-SQL Learner - 비즈니스 로직 설계 문서

## 1. 전체 흐름 요약

사용자 입력부터 결과 렌더링까지의 전체 시퀀스:

```
[브라우저]                        [서버]                          [외부 서비스]
    │                               │                                │
    │  1. API Key 확인              │                                │
    │  (localStorage)               │                                │
    │                               │                                │
    │  2. 자연어 질문 입력           │                                │
    ├──────────────────────────────>│                                │
    │     executeQuery(question,    │                                │
    │                   apiKey)     │                                │
    │                               │  3. AI 호출                    │
    │                               ├──────────────────────────────>│
    │                               │     generateText()             │  Gemini 2.5 Flash
    │                               │<──────────────────────────────┤
    │                               │     { sql, chartConfig,        │
    │                               │       explanation }            │
    │                               │                                │
    │                               │  4. SQL 검증                   │
    │                               │     validateSQL(sql)           │
    │                               │                                │
    │                               │  5. DB 실행                    │
    │                               ├──────────────────────────────>│
    │                               │     supabase.rpc(              │  Supabase
    │                               │       "execute_sql")           │  (PostgreSQL)
    │                               │<──────────────────────────────┤
    │                               │     rows[]                     │
    │                               │                                │
    │  6. 결과 렌더링               │                                │
    │<──────────────────────────────┤                                │
    │     QueryResult               │                                │
    │                               │                                │
    │  7. UI 분기                   │                                │
    │  - SqlViewer (SQL + 설명)     │                                │
    │  - ChartView (bar/line/pie)   │                                │
    │  - ResultsTable (테이블)      │                                │
```

**핵심 원칙**: 서버가 모든 비즈니스 로직을 처리하고, 클라이언트는 결과 렌더링만 담당한다.

---

## 2. API Key 관리

### 상태 흐름

```
  [앱 로드]
     │
     ▼
  localStorage에 "google_ai_api_key" 존재?
     │
     ├── No ──> ApiKeyDialog 강제 표시 (닫기 불가)
     │              │
     │              ▼
     │          사용자가 key 입력 → localStorage 저장
     │              │
     │              ▼
     │          다이얼로그 닫힘 → 쿼리 가능 상태
     │
     └── Yes ─> 쿼리 가능 상태
                    │
                    ├── Settings 버튼 클릭 → 다이얼로그 열림 (닫기 가능)
                    │       ├── "키 변경" → 새 key로 교체
                    │       └── "삭제" → key 제거 → 강제 다이얼로그로 복귀
                    │
                    └── 질문 제출 → apiKey를 Server Action에 전달
```

### `useApiKey` hook (`src/hooks/use-api-key.ts`)

React 19의 `useSyncExternalStore`를 사용하여 localStorage와 동기화한다.

| 반환값           | 타입                    | 설명                              |
| ---------------- | ----------------------- | --------------------------------- |
| `apiKey`         | `string \| null`        | 현재 저장된 API key               |
| `setApiKey(key)` | `(key: string) => void` | key 저장 후 `storage` 이벤트 발생 |
| `removeApiKey()` | `() => void`            | key 삭제 후 `storage` 이벤트 발생 |
| `needsApiKey`    | `boolean`               | `!apiKey` — key 미설정 여부       |

`storage` 이벤트를 수동 dispatch하여 같은 탭 내에서도 상태 변경이 즉시 반영된다.

### `ApiKeyDialog` 유효성 검사 (`src/components/api-key-dialog.tsx`)

- 빈 값 차단
- `AIzaSy` 접두사 검증 (Google AI API key 형식)
- key 미설정 시 다이얼로그 외부 클릭/닫기 차단 (`onInteractOutside` + `onOpenChange` 무시)

---

## 3. 쿼리 실행 파이프라인

Server Action `executeQuery()` (`src/app/actions.ts`)가 전체 흐름을 조율한다.

### 5단계 처리

```
┌─────────────────────────────────────────────────────────┐
│  executeQuery(question: string, apiKey: string)         │
│                                                         │
│  ① 입력 검증                                            │
│     └── question.trim() 비어있으면 → 에러 반환          │
│     └── apiKey 없으면 → 에러 반환                       │
│                                                         │
│  ② AI 호출                                              │
│     └── generateSqlQuery(question, apiKey)               │
│     └── 반환: { sql, chartConfig, explanation }          │
│                                                         │
│  ③ SQL 검증                                             │
│     └── validateSQL(aiResponse.sql)                      │
│     └── 실패 시 → 에러 반환 (생성된 SQL + 에러 메시지)  │
│                                                         │
│  ④ DB 실행                                              │
│     └── supabase.rpc("execute_sql", { query_text })     │
│     └── 실패 시 → 에러 반환 (SQL 실행 오류 메시지)      │
│                                                         │
│  ⑤ 결과 정규화                                          │
│     └── rows = data ?? []                                │
│     └── columns = Object.keys(rows[0])                   │
│     └── chartConfig.chartType === "none" → null로 변환   │
│     └── QueryResult 반환                                 │
└─────────────────────────────────────────────────────────┘
```

### 에러 처리 전략

`catch` 블록에서 에러 메시지를 분류하여 사용자 친화적 메시지로 변환:

| 에러 키워드                        | 사용자 메시지                       |
| ---------------------------------- | ----------------------------------- |
| `rate limit`, `quota`, `429`       | "AI API 요청 한도를 초과했습니다."  |
| `fetch`, `network`, `econnrefused` | "네트워크 오류가 발생했습니다."     |
| `timeout`, `timed out`             | "요청 시간이 초과되었습니다."       |
| 기타                               | "요청 처리 중 오류가 발생했습니다." |

---

## 4. AI 프롬프트 전략

### 모듈 구조 (`src/lib/ai.ts`)

```
createGoogleGenerativeAI({ apiKey })     ← 사용자 제공 key로 인스턴스 생성
           │
           ▼
generateText({
  model: google("gemini-2.5-flash"),
  output: Output.object({ schema }),     ← Zod 스키마로 구조화된 출력 강제
  system: buildSystemPrompt(),           ← DDL + 규칙 + few-shot 예시
  prompt: userQuestion                   ← 사용자 자연어 질문
})
```

### System Prompt 구성

```
┌──────────────────────────────────────────────┐
│  "당신은 PostgreSQL 전문가입니다..."          │
│                                              │
│  ## 데이터베이스 스키마                       │
│  CREATE TABLE customers (...)                │
│  CREATE TABLE products (...)                 │
│  CREATE TABLE orders (...)                   │
│                                              │
│  ## 규칙                                     │
│  1. SELECT/WITH으로 시작하는 읽기 전용만     │
│  2. INSERT/UPDATE/DELETE/DROP 금지           │
│  3. 결과 많으면 LIMIT 50 추가               │
│  4. 한국어/영어 모두 처리                    │
│  5. explanation은 반드시 한국어              │
│  6. 차트 타입 결정 기준 (line/bar/pie/none)  │
│                                              │
│  ## 예시 (7개 few-shot)                      │
│  질문: 도시별 고객 수를 알려줘               │
│  SQL: SELECT city, COUNT(*)...               │
│  chartConfig: { chartType: "bar", ... }      │
│  explanation: ...                            │
│  ...                                         │
└──────────────────────────────────────────────┘
```

### Zod 스키마 (`aiResponseSchema`)

```typescript
{
  sql: string,              // 생성된 PostgreSQL SELECT 쿼리
  chartConfig: {
    chartType: "bar" | "line" | "pie" | "none",
    xKey: string,            // X축 컬럼명
    yKey: string,            // Y축 컬럼명 (숫자)
    title: string            // 차트 제목 (한국어)
  } | null,
  explanation: string        // 쿼리 설명 (한국어)
}
```

### Few-shot 예시 (`src/lib/schema.ts`)

7개의 대표 질문-응답 쌍으로 차트 타입 결정을 가이드:

| 질문                      | 차트 타입 | 이유          |
| ------------------------- | --------- | ------------- |
| 도시별 고객 수            | `bar`     | 카테고리 비교 |
| 월별 매출 추이            | `line`    | 시계열 데이터 |
| 가격 30달러 미만 상품     | `null`    | 단순 목록     |
| 연령대별 주문 건수        | `bar`     | 카테고리 비교 |
| 브랜드별 평균 평점 TOP 10 | `bar`     | 카테고리 비교 |
| 성별 매출 비교            | `pie`     | 비율/구성     |
| 카테고리별 매출 순위      | `bar`     | 카테고리 비교 |

---

## 5. SQL 안전성 검증

`validateSQL()` (`src/lib/validate-sql.ts`)은 3단계로 SQL을 검증한다.

```
입력 SQL
   │
   ▼
┌──────────────────────────────────────┐
│  1단계: SELECT/WITH 시작 확인        │
│  ──────────────────────────────────  │
│  upper.startsWith("SELECT") 또는     │
│  upper.startsWith("WITH") 이어야 함  │
│  → 실패 시: "SELECT 또는 WITH으로    │
│             시작하는 쿼리만 허용"     │
└──────────────┬───────────────────────┘
               │ 통과
               ▼
┌──────────────────────────────────────┐
│  2단계: 다중 statement 차단          │
│  ──────────────────────────────────  │
│  끝의 세미콜론 제거 후               │
│  내부에 세미콜론이 있으면 차단       │
│  → "다중 SQL 문은 허용되지 않습니다" │
│                                      │
│  예: "SELECT 1; DROP TABLE x" → 차단 │
└──────────────┬───────────────────────┘
               │ 통과
               ▼
┌──────────────────────────────────────┐
│  3단계: 위험 키워드 차단             │
│  ──────────────────────────────────  │
│  단어 경계(\b) 기준으로 검사:        │
│  INSERT, UPDATE, DELETE, DROP,       │
│  ALTER, TRUNCATE, CREATE,            │
│  GRANT, REVOKE, EXEC                 │
│  → "금지된 키워드: {keyword}"        │
└──────────────┬───────────────────────┘
               │ 통과
               ▼
          { valid: true }
```

---

## 6. 결과 렌더링

### `QueryContainer` 상태 관리 (`src/components/query-container.tsx`)

```typescript
const [result, setResult] = useState<QueryResult | null>(null);
const [isLoading, setIsLoading] = useState(false);
```

### 조건부 UI 분기

```
QueryContainer
│
├── <header>
│   ├── "Ask to DB!" 타이틀
│   ├── Settings 버튼 (API Key 다이얼로그 열기)
│   └── TextType (타이핑 애니메이션으로 예시 질문 순환)
│
├── <QueryInput>                           ← 항상 표시
│   ├── 텍스트 입력 + "질문하기" 버튼
│   └── 예시 질문 8개 (클릭 시 즉시 제출)
│
├── isLoading === true?
│   └── <ResultSkeleton>                   ← SQL + 테이블 스켈레톤
│
├── !isLoading && result?.error?
│   └── <ErrorMessage>                     ← 에러 Alert (destructive)
│
├── !isLoading && result?.success?
│   ├── <SqlViewer>                        ← SQL 구문 하이라이팅 + 설명
│   ├── result.chartConfig !== null?
│   │   └── <ChartView>                    ← 차트 (bar/line/pie)
│   └── <ResultsTable>                     ← 테이블 (최대 100행)
│
└── <ApiKeyDialog>                         ← 항상 마운트 (open으로 제어)
```

### 차트 타입 결정 및 렌더링 (`src/components/chart-view.tsx`)

| chartType | Recharts 컴포넌트        | 설명                                             |
| --------- | ------------------------ | ------------------------------------------------ |
| `bar`     | `<BarChart>` + `<Bar>`   | 카테고리별 비교, 각 Bar에 고유 색상              |
| `line`    | `<LineChart>` + `<Line>` | 시계열 추이, 단일 색상 (`#e76e50`)               |
| `pie`     | `<PieChart>` + `<Pie>`   | 비율 표시, 각 Slice에 고유 색상 + Label + Legend |
| `none`    | 렌더링 안 함             | Server Action에서 `null`로 정규화됨              |

**색상 팔레트** (고정 HEX, CSS 변수 미사용):

```
#e76e50, #2a9d8f, #264653, #e9c46a, #f4a261, #8884d8, #82ca9d, #ffc658
```

**숫자 처리**: Supabase의 NUMERIC 컬럼이 문자열로 반환되므로, `BigNumber`로 소수점 2자리 버림(ROUND_DOWN) 후 `toNumber()` 변환.

### SQL 구문 하이라이팅 (`src/components/sql-viewer.tsx`)

정규식 기반 토크나이저로 3가지 타입을 구분:

- **keyword** (파란색): SELECT, FROM, WHERE, JOIN 등
- **string** (녹색): `'...'` 리터럴
- **number** (황색): 숫자 리터럴

---

## 7. 보안 모델

```
┌─────────────────────────────────────────────────────────────┐
│                        보안 레이어                           │
│                                                             │
│  Layer 1: 클라이언트 — API Key 격리                         │
│  ─────────────────────────────────────                      │
│  Google AI API key는 브라우저 localStorage에만 저장          │
│  서버 환경변수에 저장하지 않음 → 서버 유출 위험 제거         │
│  Server Action 호출 시 인자로 전달 (HTTPS 보호)             │
│                                                             │
│  Layer 2: 애플리케이션 — SQL 이중 검증                      │
│  ─────────────────────────────────────                      │
│  ┌─ AI 프롬프트: "SELECT/WITH 읽기 전용만 생성"             │
│  └─ validateSQL(): SELECT 시작 + 위험 키워드 + 다중문 차단  │
│                                                             │
│  Layer 3: 데이터베이스 — RLS + SECURITY INVOKER             │
│  ─────────────────────────────────────                      │
│  Supabase anon key 사용 (서비스 key 아님)                   │
│  RLS(Row Level Security) 활성화 → SELECT만 허용             │
│  execute_sql 함수: SECURITY INVOKER                         │
│    → anon 역할 권한으로 실행                                │
│    → RLS 정책이 적용됨                                      │
│    → 시스템 테이블 접근 차단                                │
│                                                             │
│  [심층 방어 구조]                                            │
│  AI가 위험 SQL 생성 → validateSQL()이 차단                  │
│  validateSQL() 우회 → RLS가 차단                            │
│  3중 방어로 데이터 안전성 확보                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 8. 핵심 데이터 구조

### `QueryResult` (`src/types/index.ts`)

Server Action의 최종 반환 타입. 성공/실패 모두 이 구조로 통일.

```typescript
interface QueryResult {
  success: boolean; // 성공 여부
  sql: string; // 생성된 SQL (실패 시 빈 문자열)
  rows: Record<string, unknown>[]; // 쿼리 결과 행
  columns: string[]; // 컬럼명 배열
  chartConfig: ChartConfig | null; // 차트 설정 (none이면 null)
  explanation: string; // 한국어 설명
  error?: string; // 에러 메시지 (실패 시만)
}
```

### `ChartConfig` (`src/types/index.ts`)

차트 렌더링에 필요한 최소 정보.

```typescript
interface ChartConfig {
  chartType: 'bar' | 'line' | 'pie' | 'none'; // 차트 종류
  xKey: string; // X축 컬럼명
  yKey: string; // Y축 컬럼명
  title: string; // 차트 제목 (한국어)
}
```

### `AiResponse` (`src/lib/ai.ts`)

AI가 반환하는 구조화된 응답. Zod 스키마에서 추론.

```typescript
type AiResponse = {
  sql: string; // 생성된 SQL
  chartConfig: {
    // 차트 설정
    chartType: 'bar' | 'line' | 'pie' | 'none';
    xKey: string;
    yKey: string;
    title: string;
  } | null;
  explanation: string; // 쿼리 설명 (한국어)
};
```

### `ValidationResult` (`src/lib/validate-sql.ts`)

SQL 검증 결과.

```typescript
interface ValidationResult {
  valid: boolean;
  error?: string; // 실패 시 사유
}
```

---

### 서버/클라이언트 경계

```
┌─────────────── Server ───────────────┐  ┌─────────── Client ────────────┐
│                                      │  │                               │
│  page.tsx (Server Component)         │  │  query-container.tsx          │
│  actions.ts (Server Action)          │  │  query-input.tsx              │
│  ai.ts                               │  │  sql-viewer.tsx               │
│  validate-sql.ts                     │  │  results-table.tsx            │
│  supabase.ts                         │  │  chart-view.tsx               │
│  schema.ts                           │  │  error-message.tsx            │
│  types/index.ts                      │  │  result-skeleton.tsx          │
│                                      │  │  api-key-dialog.tsx           │
│                                      │  │  text-type.tsx                │
│                                      │  │  use-api-key.ts               │
└──────────────────────────────────────┘  └───────────────────────────────┘
```
