"use client";

import { useMemo } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const SQL_KEYWORDS =
  /\b(SELECT|FROM|WHERE|JOIN|LEFT|RIGHT|INNER|OUTER|CROSS|ON|GROUP\s+BY|ORDER\s+BY|LIMIT|OFFSET|AS|AND|OR|NOT|IN|BETWEEN|LIKE|IS|NULL|CASE|WHEN|THEN|ELSE|END|WITH|HAVING|UNION|ALL|DISTINCT|EXISTS|DESC|ASC|ROUND|COUNT|SUM|AVG|MIN|MAX|COALESCE|TO_CHAR)\b/gi;

const SQL_STRINGS = /'[^']*'/g;
const SQL_NUMBERS = /\b(\d+(?:\.\d+)?)\b/g;

interface SqlToken {
  type: "keyword" | "string" | "number" | "text";
  value: string;
}

function tokenizeSQL(sql: string): SqlToken[] {
  const tokens: SqlToken[] = [];
  const combined = new RegExp(
    `(${SQL_STRINGS.source})|(${SQL_KEYWORDS.source})|(${SQL_NUMBERS.source})`,
    "gi"
  );

  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = combined.exec(sql)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: "text", value: sql.slice(lastIndex, match.index) });
    }

    if (match[1] !== undefined) {
      tokens.push({ type: "string", value: match[0] });
    } else if (match[2] !== undefined) {
      tokens.push({ type: "keyword", value: match[0] });
    } else {
      tokens.push({ type: "number", value: match[0] });
    }

    lastIndex = combined.lastIndex;
  }

  if (lastIndex < sql.length) {
    tokens.push({ type: "text", value: sql.slice(lastIndex) });
  }

  return tokens;
}

const TOKEN_CLASSES: Record<SqlToken["type"], string> = {
  keyword: "font-bold text-blue-600 dark:text-blue-400",
  string: "text-green-700 dark:text-green-400",
  number: "text-amber-600 dark:text-amber-400",
  text: "",
};

interface SqlViewerProps {
  sql: string;
  explanation: string;
}

export function SqlViewer({ sql, explanation }: SqlViewerProps) {
  const tokens = useMemo(() => tokenizeSQL(sql), [sql]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">생성된 SQL</CardTitle>
        <CardDescription>{explanation}</CardDescription>
      </CardHeader>
      <CardContent>
        <pre className="overflow-x-auto rounded-md bg-muted p-4 text-sm">
          <code>
            {tokens.map((token, i) => {
              const cls = TOKEN_CLASSES[token.type];
              return cls ? (
                <span key={i} className={cls}>
                  {token.value}
                </span>
              ) : (
                token.value
              );
            })}
          </code>
        </pre>
      </CardContent>
    </Card>
  );
}
