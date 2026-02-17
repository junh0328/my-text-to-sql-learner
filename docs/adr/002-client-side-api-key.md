# ADR-002: Google AI API Key를 클라이언트(localStorage)에서 관리

## 상태

승인됨 (2026-02-09)

## 맥락

AI 호출에 Google AI API key가 필요하다. 학습용 서비스이므로 서버 비용 없이 사용자가 자신의 키를 사용하도록 해야 한다.

## 고려한 대안

### 1. 서버 환경변수 (GOOGLE_GENERATIVE_AI_API_KEY)

- 장점: 사용자 경험 간단
- 단점: 서버 운영자가 비용 부담, 무분별한 사용 가능

### 2. 사용자 인증 + 서버 key 공유

- 장점: 사용량 제어 가능
- 단점: 인증 시스템 필요, 여전히 서버 비용 발생

### 3. 클라이언트 localStorage에 사용자 키 저장 (채택)

- 장점: 서버 비용 0, 사용자가 자신의 키/쿼터 사용
- 단점: 사용자가 직접 API key 발급 필요

## 결정

**사용자 브라우저 localStorage에 API key 저장**, Server Action 호출 시 매번 전달하는 방식을 채택한다.

- `useApiKey` 훅으로 localStorage 관리 (`useSyncExternalStore` 패턴)
- key가 없으면 `ApiKeyDialog`로 입력 유도
- Server Action에서 `createGoogleGenerativeAI({ apiKey })`로 사용자 키 사용

## 결과

- 서버 운영 비용 0원
- 사용자가 API key를 발급받아야 하는 진입 장벽 존재
- key는 브라우저에만 존재하므로 서버 유출 위험 없음
