"use server";

import { generateSqlQuery } from "@/lib/ai";
import { validateSQL } from "@/lib/validate-sql";
import { supabase } from "@/lib/supabase";
import type { QueryResult } from "@/types";

export async function executeQuery(question: string, apiKey: string): Promise<QueryResult> {
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

    if (!apiKey) {
      return {
        success: false,
        sql: "",
        rows: [],
        columns: [],
        chartConfig: null,
        explanation: "",
        error: "API key가 설정되지 않았습니다.",
      };
    }

    // 1. AI 호출 — 자연어 → SQL 변환
    const aiResponse = await generateSqlQuery(question, apiKey);

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
    const message = err instanceof Error ? err.message.toLowerCase() : "";

    let userMessage: string;
    if (message.includes("rate limit") || message.includes("quota") || message.includes("429")) {
      userMessage = "AI API 요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.";
    } else if (message.includes("fetch") || message.includes("network") || message.includes("econnrefused")) {
      userMessage = "네트워크 오류가 발생했습니다. 인터넷 연결을 확인해주세요.";
    } else if (message.includes("timeout") || message.includes("timed out")) {
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
}
