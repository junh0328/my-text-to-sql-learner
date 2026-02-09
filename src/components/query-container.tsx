"use client";

import { useState } from "react";
import { Settings } from "lucide-react";
import { executeQuery } from "@/app/actions";
import { useApiKey } from "@/hooks/use-api-key";
import { ApiKeyDialog } from "@/components/api-key-dialog";
import { QueryInput } from "@/components/query-input";
import { SqlViewer } from "@/components/sql-viewer";
import { ResultsTable } from "@/components/results-table";
import { ChartView } from "@/components/chart-view";
import { ErrorMessage } from "@/components/error-message";
import { ResultSkeleton } from "@/components/result-skeleton";
import { Button } from "@/components/ui/button";
import type { QueryResult } from "@/types";

export function QueryContainer() {
  const { apiKey, setApiKey, removeApiKey, needsApiKey } = useApiKey();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const showDialog = isDialogOpen || needsApiKey;

  const handleSubmit = async (question: string) => {
    if (!apiKey) {
      setIsDialogOpen(true);
      return;
    }

    setIsLoading(true);
    setResult(null);
    try {
      const data = await executeQuery(question, apiKey);
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

  const handleDialogOpenChange = (open: boolean) => {
    if (!open && needsApiKey) return;
    setIsDialogOpen(open);
  };

  const handleApiKeySubmit = (key: string) => {
    setApiKey(key);
    setIsDialogOpen(false);
  };

  const handleApiKeyDelete = () => {
    removeApiKey();
  };

  return (
    <>
      <header className="mb-8 text-center">
        <div className="flex items-center justify-center gap-2">
          <h1 className="text-3xl font-bold tracking-tight">Text-to-SQL</h1>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            title="API Key 설정"
            className="text-muted-foreground"
          >
            <Settings className="h-5 w-5" />
          </Button>
        </div>
        <p className="mt-2 text-muted-foreground">
          자연어로 데이터를 조회하고 시각화하세요
        </p>
      </header>

      <div className="space-y-6">
        <QueryInput onSubmit={handleSubmit} isLoading={isLoading} />

        {isLoading && <ResultSkeleton />}

        {!isLoading && result?.error && <ErrorMessage message={result.error} />}

        {!isLoading && result?.success && (
          <>
            <SqlViewer sql={result.sql} explanation={result.explanation} />

            {result.chartConfig && (
              <ChartView config={result.chartConfig} rows={result.rows} />
            )}

            <ResultsTable columns={result.columns} rows={result.rows} />
          </>
        )}
      </div>

      <ApiKeyDialog
        open={showDialog}
        onOpenChange={handleDialogOpenChange}
        hasKey={!needsApiKey}
        onSubmit={handleApiKeySubmit}
        onDelete={handleApiKeyDelete}
      />
    </>
  );
}
