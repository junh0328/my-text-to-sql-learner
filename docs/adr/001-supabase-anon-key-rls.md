# ADR-001: Supabase anon key + RLS 기반 DB 접근 전략

## 상태

승인됨 (2026-02-09)

## 맥락

사용자가 자연어로 입력한 질문을 SQL로 변환하여 실제 DB에서 실행해야 한다. 학습용 서비스이므로 누구나 접근 가능하되, 데이터 변조는 방지해야 한다.

## 고려한 대안

### 1. Service role key + 서버 미들웨어 검증

- 장점: 서버에서 모든 권한 제어 가능
- 단점: key 노출 시 전체 DB 접근 가능, 서버 사이드 검증 로직 복잡

### 2. anon key + RLS (채택)

- 장점: DB 레벨에서 권한 강제, key 노출되어도 SELECT만 가능
- 단점: RLS 정책 관리 필요

### 3. 별도 API 서버 + 인증

- 장점: 완전한 접근 제어
- 단점: 학습 서비스에 과도한 인프라, 복잡도 증가

## 결정

**anon key + RLS** 방식을 채택한다.

- `execute_sql` RPC 함수를 `SECURITY INVOKER`로 설정하여 anon 권한으로 실행
- RLS 정책으로 SELECT만 허용, 시스템 테이블 접근 차단
- 코드 레벨에서도 `validateSQL()`로 이중 방어

## 결과

- DB 레벨 방어 + 코드 레벨 방어의 이중 구조
- anon key가 클라이언트에 노출되어도 안전
- RLS 정책 변경 시 `supabase/seed.sql` 업데이트 필요
