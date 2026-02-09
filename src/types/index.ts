export interface ChartConfig {
  chartType: "bar" | "line" | "pie" | "none";
  xKey: string;
  yKey: string;
  title: string;
}

export interface QueryResult {
  success: boolean;
  sql: string;
  rows: Record<string, unknown>[];
  columns: string[];
  chartConfig: ChartConfig | null;
  explanation: string;
  error?: string;
}
