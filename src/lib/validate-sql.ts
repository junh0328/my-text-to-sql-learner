const DANGEROUS_KEYWORDS = [
  "INSERT",
  "UPDATE",
  "DELETE",
  "DROP",
  "ALTER",
  "TRUNCATE",
  "CREATE",
  "GRANT",
  "REVOKE",
  "EXEC",
];

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export function validateSQL(sql: string): ValidationResult {
  const trimmed = sql.trim();

  if (!trimmed) {
    return { valid: false, error: "SQL이 비어 있습니다." };
  }

  // SELECT 또는 WITH으로 시작하는지 확인
  const upper = trimmed.toUpperCase();
  if (!upper.startsWith("SELECT") && !upper.startsWith("WITH")) {
    return {
      valid: false,
      error: "SELECT 또는 WITH으로 시작하는 쿼리만 허용됩니다.",
    };
  }

  // 다중 statement 차단 (문자열 내부가 아닌 세미콜론)
  const withoutTrailingSemicolon = trimmed.replace(/;\s*$/, "");
  if (withoutTrailingSemicolon.includes(";")) {
    return {
      valid: false,
      error: "다중 SQL 문은 허용되지 않습니다.",
    };
  }

  // 위험 키워드 차단 (단어 경계 기준)
  for (const keyword of DANGEROUS_KEYWORDS) {
    const regex = new RegExp(`\\b${keyword}\\b`, "i");
    if (regex.test(trimmed)) {
      return {
        valid: false,
        error: `금지된 키워드가 포함되어 있습니다: ${keyword}`,
      };
    }
  }

  return { valid: true };
}
