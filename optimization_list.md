# Optimization List

CTO 과제 평가 리포트 기반 개선 사항 목록.

---

## 1. [높음] page.tsx "use client" → Server/Client 분리

**현재 문제**: 메인 페이지 전체가 Client Component로, Next.js 서버 렌더링 이점(초기 로딩, SEO)을 활용하지 못함.

**현재 코드** (`src/app/page.tsx`):

```tsx
"use client";

import { useState } from "react";
import { executeQuery } from "./actions";
// ...

export default function Home() {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (question: string) => { /* ... */ };

  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header>...</header>
      <main>
        <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
        {result?.error && <ErrorMessage message={result.error} />}
        {result?.success && (
          <>
            <SqlViewer ... />
            <ChartView ... />
            <ResultsTable ... />
          </>
        )}
      </main>
    </div>
  );
}
```

**권장 코드**:

`src/app/page.tsx` (Server Component):

```tsx
import { QueryContainer } from "@/components/query-container";

export default function Home() {
  return (
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Text-to-SQL</h1>
        <p className="mt-2 text-muted-foreground">
          자연어로 데이터를 조회하고 시각화하세요
        </p>
      </header>
      <main className="space-y-6">
        <QueryContainer />
      </main>
    </div>
  );
}
```

`src/components/query-container.tsx` (Client Component):

```tsx
"use client";

import { useState } from "react";
import { executeQuery } from "@/app/actions";
import { QueryInput } from "@/components/query-input";
import { SqlViewer } from "@/components/sql-viewer";
import { ResultsTable } from "@/components/results-table";
import { ChartView } from "@/components/chart-view";
import { ErrorMessage } from "@/components/error-message";
import type { QueryResult } from "@/types";

export function QueryContainer() {
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (question: string) => {
    setIsLoading(true);
    setResult(null);
    try {
      const data = await executeQuery(question);
      setResult(data);
    } catch {
      setResult({
        success: false,
        sql: "",
        rows: [],
        columns: [],
        chartConfig: null,
        explanation: "",
        error: "요청 처리 중 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />
      {result?.error && <ErrorMessage message={result.error} />}
      {result?.success && (
        <>
          <SqlViewer sql={result.sql} explanation={result.explanation} />
          {result.chartConfig && (
            <ChartView config={result.chartConfig} rows={result.rows} />
          )}
          <ResultsTable columns={result.columns} rows={result.rows} />
        </>
      )}
    </>
  );
}
```

---

## 2. [높음] 환경변수 Non-null Assertion 제거

**현재 문제**: `!` 단언으로 환경변수 누락 시 cryptic 런타임 에러 발생.

**현재 코드** (`src/lib/supabase.ts`):

```typescript
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
```

**권장 코드**:

```typescript
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) throw new Error("SUPABASE_URL 환경변수가 설정되지 않았습니다.");
if (!supabaseServiceRoleKey) throw new Error("SUPABASE_SERVICE_ROLE_KEY 환경변수가 설정되지 않았습니다.");

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);
```

---

## 3. [중간] 결과 테이블 대량 데이터 방어

**현재 문제**: AI가 LIMIT을 빼먹을 경우 수천 행이 한 번에 DOM에 렌더링될 수 있음.

**현재 코드** (`src/components/results-table.tsx`):

```tsx
<TableBody>
  {rows.map((row, i) => (
    <TableRow key={i}>
      {columns.map((col) => (
        <TableCell key={col}>{String(row[col] ?? "")}</TableCell>
      ))}
    </TableRow>
  ))}
</TableBody>
```

**권장 코드**:

```tsx
const MAX_DISPLAY_ROWS = 100;
const displayRows = rows.slice(0, MAX_DISPLAY_ROWS);
const hasMore = rows.length > MAX_DISPLAY_ROWS;

// ...

<TableBody>
  {displayRows.map((row, i) => (
    <TableRow key={i}>
      {columns.map((col) => (
        <TableCell key={col}>{String(row[col] ?? "")}</TableCell>
      ))}
    </TableRow>
  ))}
</TableBody>

{hasMore && (
  <p className="mt-2 text-sm text-muted-foreground">
    전체 {rows.length}건 중 {MAX_DISPLAY_ROWS}건만 표시합니다.
  </p>
)}
```

---

## 4. [중간] 에러 유형별 사용자 메시지 분기

**현재 문제**: 모든 에러가 동일한 형태로 표시됨. 사용자가 "재시도해야 하는지" vs "질문을 바꿔야 하는지" 판단 불가.

**현재 코드** (`src/app/actions.ts`):

```typescript
} catch (err) {
  return {
    success: false,
    sql: "",
    rows: [],
    columns: [],
    chartConfig: null,
    explanation: "",
    error: err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.",
  };
}
```

**권장 코드**:

```typescript
} catch (err) {
  const message = err instanceof Error ? err.message : "";

  let userMessage: string;
  if (message.includes("rate limit") || message.includes("quota")) {
    userMessage = "AI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
  } else if (message.includes("fetch") || message.includes("network")) {
    userMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
  } else if (message.includes("timeout")) {
    userMessage = "요청 시간이 초과되었습니다. 더 간단한 질문으로 시도해주세요.";
  } else {
    userMessage = "요청 처리 중 오류가 발생했습니다. 질문을 바꿔서 다시 시도해주세요.";
  }

  return {
    success: false,
    sql: "",
    rows: [],
    columns: [],
    chartConfig: null,
    explanation: "",
    error: userMessage,
  };
}
```

---

## 5. [낮음] SQL 뷰어 신택스 하이라이팅

**현재 문제**: `<pre><code>` 태그만 사용하여 SQL이 단색 텍스트로 표시됨.

**현재 코드** (`src/components/sql-viewer.tsx`):

```tsx
<pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
  <code>{sql}</code>
</pre>
```

**권장 방안**: 경량 하이라이터 사용 또는 CSS 기반 키워드 강조.

```bash
pnpm add shiki
```

```tsx
import { codeToHtml } from "shiki";

// Server Component에서 사용 시:
const html = await codeToHtml(sql, { lang: "sql", theme: "github-light" });
return <div dangerouslySetInnerHTML={{ __html: html }} />;
```

또는 외부 라이브러리 없이 간단한 정규식 하이라이팅:

```tsx
function highlightSQL(sql: string) {
  const keywords = /\b(SELECT|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|LIMIT|AS|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|COUNT|SUM|AVG|MIN|MAX|DISTINCT|HAVING|UNION|WITH|CASE|WHEN|THEN|ELSE|END|LEFT|RIGHT|INNER|OUTER|DESC|ASC)\b/gi;
  return sql.replace(keywords, '<span class="font-bold text-blue-600">$1</span>');
}

// 사용
<pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
  <code dangerouslySetInnerHTML={{ __html: highlightSQL(sql) }} />
</pre>
```
