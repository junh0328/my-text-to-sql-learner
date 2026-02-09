"use server";

import { generateSqlQuery } from "@/lib/ai";
import { validateSQL } from "@/lib/validate-sql";
import { supabase } from "@/lib/supabase";
import type { QueryResult } from "@/types";

export async function executeQuery(question: string): Promise<QueryResult> {
  try {
    if (!question.trim()) {
      return {
        success: false,
        sql: "",
        rows: [],
        columns: [],
        chartConfig: null,
        explanation: "",
        error: "질문을 입력해주세요.",
      };
    }

    // 1. AI 호출 — 자연어 → SQL 변환
    const aiResponse = await generateSqlQuery(question);

    // 2. SQL 안전성 검증
    const validation = validateSQL(aiResponse.sql);
    if (!validation.valid) {
      return {
        success: false,
        sql: aiResponse.sql,
        rows: [],
        columns: [],
        chartConfig: null,
        explanation: aiResponse.explanation,
        error: `SQL 검증 실패: ${validation.error}`,
      };
    }

    // 3. Supabase RPC로 SQL 실행
    const { data, error } = await supabase.rpc("execute_sql", {
      query_text: aiResponse.sql,
    });

    if (error) {
      return {
        success: false,
        sql: aiResponse.sql,
        rows: [],
        columns: [],
        chartConfig: null,
        explanation: aiResponse.explanation,
        error: `SQL 실행 오류: ${error.message}`,
      };
    }

    const rows = (data ?? []) as Record<string, unknown>[];
    const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

    // 4. chartConfig에서 none이면 null로 정규화
    const chartConfig =
      aiResponse.chartConfig?.chartType === "none"
        ? null
        : aiResponse.chartConfig;

    return {
      success: true,
      sql: aiResponse.sql,
      rows,
      columns,
      chartConfig,
      explanation: aiResponse.explanation,
    };
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
}
