"use client";

import { useState } from "react";
import { executeQuery } from "./actions";
import { QueryInput } from "@/components/query-input";
import { SqlViewer } from "@/components/sql-viewer";
import { ResultsTable } from "@/components/results-table";
import { ChartView } from "@/components/chart-view";
import { ErrorMessage } from "@/components/error-message";
import type { QueryResult } from "@/types";

export default function Home() {
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
    <div className="mx-auto min-h-screen max-w-4xl px-4 py-8">
      <header className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">
          Text-to-SQL
        </h1>
        <p className="mt-2 text-muted-foreground">
          자연어로 데이터를 조회하고 시각화하세요
        </p>
      </header>

      <main className="space-y-6">
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
      </main>
    </div>
  );
}
