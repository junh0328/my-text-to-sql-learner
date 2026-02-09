"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const MAX_DISPLAY_ROWS = 100;

interface ResultsTableProps {
  columns: string[];
  rows: Record<string, unknown>[];
}

export function ResultsTable({ columns, rows }: ResultsTableProps) {
  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-6 text-center text-muted-foreground">
          결과가 없습니다.
        </CardContent>
      </Card>
    );
  }

  const displayRows = rows.slice(0, MAX_DISPLAY_ROWS);
  const hasMore = rows.length > MAX_DISPLAY_ROWS;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">
          조회 결과 ({rows.length}건)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) => (
                  <TableHead key={col}>{col}</TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRows.map((row, i) => (
                <TableRow key={i}>
                  {columns.map((col) => (
                    <TableCell key={col}>{String(row[col] ?? "")}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {hasMore && (
          <p className="mt-3 text-center text-sm text-muted-foreground">
            전체 {rows.length}건 중 {MAX_DISPLAY_ROWS}건만 표시합니다.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
