"use client";

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import BigNumber from "bignumber.js";
import type { ChartConfig } from "@/types";

const COLORS = [
  "#e76e50",
  "#2a9d8f",
  "#264653",
  "#e9c46a",
  "#f4a261",
  "#8884d8",
  "#82ca9d",
  "#ffc658",
];

const PRIMARY_COLOR = COLORS[0];

interface ChartViewProps {
  config: ChartConfig;
  rows: Record<string, unknown>[];
}

export function ChartView({ config, rows }: ChartViewProps) {
  // 숫자 컬럼은 BigNumber로 소수점 2자리 버림 처리 (Supabase NUMERIC은 문자열로 반환)
  const data = rows.map((row) => ({
    ...row,
    [config.yKey]: new BigNumber(String(row[config.yKey]))
      .decimalPlaces(2, BigNumber.ROUND_DOWN)
      .toNumber(),
  }));

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{config.title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          {config.chartType === "bar" ? (
            <BarChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} />
              <YAxis />
              <Tooltip />
              <Bar dataKey={config.yKey}>
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          ) : config.chartType === "line" ? (
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey={config.xKey} />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey={config.yKey}
                stroke={PRIMARY_COLOR}
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            <PieChart>
              <Pie
                data={data}
                dataKey={config.yKey}
                nameKey={config.xKey}
                cx="50%"
                cy="50%"
                outerRadius={120}
                label
              >
                {data.map((_, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
