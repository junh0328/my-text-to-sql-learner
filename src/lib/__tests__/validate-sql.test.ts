import { describe, it, expect } from "vitest";
import { validateSQL } from "../validate-sql";

describe("validateSQL", () => {
  // 허용되어야 하는 케이스
  describe("허용 케이스", () => {
    it("기본 SELECT 쿼리", () => {
      expect(validateSQL("SELECT * FROM users").valid).toBe(true);
    });

    it("WITH (CTE) 쿼리", () => {
      const sql =
        "WITH cte AS (SELECT id FROM users) SELECT * FROM cte";
      expect(validateSQL(sql).valid).toBe(true);
    });

    it("소문자 select", () => {
      expect(validateSQL("select name from products").valid).toBe(true);
    });

    it("끝에 세미콜론이 있는 SELECT", () => {
      expect(validateSQL("SELECT * FROM orders;").valid).toBe(true);
    });

    it("앞뒤 공백이 있는 쿼리", () => {
      expect(validateSQL("  SELECT 1  ").valid).toBe(true);
    });
  });

  // 차단되어야 하는 케이스
  describe("차단 케이스", () => {
    it("빈 문자열", () => {
      const result = validateSQL("");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("비어");
    });

    it("DROP TABLE", () => {
      const result = validateSQL("DROP TABLE users");
      expect(result.valid).toBe(false);
    });

    it("INSERT INTO", () => {
      const result = validateSQL("INSERT INTO users VALUES (1)");
      expect(result.valid).toBe(false);
    });

    it("UPDATE 문", () => {
      const result = validateSQL("UPDATE users SET name = 'a'");
      expect(result.valid).toBe(false);
    });

    it("DELETE 문", () => {
      const result = validateSQL("DELETE FROM users");
      expect(result.valid).toBe(false);
    });

    it("다중 statement (SQL injection)", () => {
      const result = validateSQL("SELECT 1; DROP TABLE users");
      expect(result.valid).toBe(false);
      expect(result.error).toContain("다중");
    });

    it("ALTER TABLE", () => {
      const result = validateSQL("ALTER TABLE users ADD COLUMN age INT");
      expect(result.valid).toBe(false);
    });

    it("TRUNCATE", () => {
      const result = validateSQL("TRUNCATE users");
      expect(result.valid).toBe(false);
    });

    it("CREATE TABLE", () => {
      const result = validateSQL("CREATE TABLE hack (id INT)");
      expect(result.valid).toBe(false);
    });
  });
});
