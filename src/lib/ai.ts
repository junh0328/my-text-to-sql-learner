import { generateText, Output } from "ai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { z } from "zod";
import { DATABASE_SCHEMA, FEW_SHOT_EXAMPLES } from "./schema";

const aiResponseSchema = z.object({
  sql: z.string().describe("생성된 PostgreSQL SELECT 쿼리"),
  chartConfig: z
    .object({
      chartType: z
        .enum(["bar", "line", "pie", "none"])
        .describe("시계열→line, 카테고리 비교→bar, 비율→pie, 원시 데이터→none"),
      xKey: z.string().describe("X축에 사용할 컬럼명"),
      yKey: z.string().describe("Y축에 사용할 컬럼명 (숫자 컬럼)"),
      title: z.string().describe("차트 제목 (한국어)"),
    })
    .nullable()
    .describe("차트 설정. 원시 데이터 목록이면 null"),
  explanation: z
    .string()
    .describe("사용자에게 보여줄 쿼리 설명 (한국어)"),
});

export type AiResponse = z.infer<typeof aiResponseSchema>;

function buildSystemPrompt(): string {
  const examples = FEW_SHOT_EXAMPLES.map(
    (ex) =>
      `질문: ${ex.question}\nSQL: ${ex.sql}\nchartConfig: ${JSON.stringify(ex.chartConfig)}\nexplanation: ${ex.explanation}`
  ).join("\n\n");

  return `당신은 PostgreSQL 전문가입니다. 사용자의 자연어 질문을 SQL 쿼리로 변환합니다.

## 데이터베이스 스키마
${DATABASE_SCHEMA}

## 규칙
1. 반드시 SELECT 또는 WITH으로 시작하는 읽기 전용 쿼리만 생성하세요.
2. INSERT, UPDATE, DELETE, DROP 등 데이터 변경 쿼리는 절대 생성하지 마세요.
3. 결과가 많을 수 있는 경우 LIMIT 50을 추가하세요.
4. 사용자가 한국어 또는 영어로 질문할 수 있습니다.
5. explanation은 반드시 한국어로 작성하세요.
6. 차트 타입 결정 기준:
   - 시계열 데이터 (날짜/월별 추이) → line
   - 카테고리별 비교 (도시별, 상태별 등) → bar
   - 비율/구성 (전체 대비 비율) → pie
   - 단순 목록/원시 데이터 → none (chartConfig를 null로)

## 예시
${examples}`;
}

export async function generateSqlQuery(
  userQuestion: string,
  apiKey: string
): Promise<AiResponse> {
  const google = createGoogleGenerativeAI({ apiKey });

  const { output } = await generateText({
    model: google("gemini-2.5-flash"),
    output: Output.object({ schema: aiResponseSchema }),
    system: buildSystemPrompt(),
    prompt: userQuestion,
  });

  if (!output) {
    throw new Error("AI가 유효한 응답을 생성하지 못했습니다.");
  }

  return output;
}
