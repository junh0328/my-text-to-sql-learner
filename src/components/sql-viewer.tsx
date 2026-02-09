"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface SqlViewerProps {
  sql: string;
  explanation: string;
}

export function SqlViewer({ sql, explanation }: SqlViewerProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">생성된 SQL</CardTitle>
        <CardDescription>{explanation}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>{sql}</code>
        </pre>
      </CardContent>
    </Card>
  );
}
