# ADR-003: Recharts에서 고정 HEX 색상 팔레트 사용

## 상태

승인됨 (2026-02-09)

## 맥락

쿼리 결과를 bar/line/pie 차트로 시각화해야 한다. shadcn/ui는 CSS 변수(`hsl(var(--chart-1))`)로 테마 색상을 정의하지만, Recharts SVG 렌더러는 CSS 변수를 해석하지 못한다.

## 고려한 대안

### 1. CSS 변수 기반 색상 (shadcn 기본)

- 장점: 테마 일관성
- 단점: Recharts SVG에서 CSS 변수 미지원, 차트 색상이 적용되지 않음

### 2. JavaScript에서 CSS 변수 해석 후 전달

- 장점: 테마 일관성 유지 가능
- 단점: `getComputedStyle` 호출 필요, SSR 불가, 복잡도 증가

### 3. 고정 HEX 색상 팔레트 (채택)

- 장점: 단순하고 확실한 동작, SSR 무관
- 단점: 다크 모드 대응 시 별도 팔레트 필요

## 결정

**고정 HEX 색상 배열**을 `chart-view.tsx`에 정의하여 사용한다.

- 다크 모드는 현재 미지원 (학습 서비스 스코프 외)
- Recharts 3.x에서 CSS 변수 지원 시 재검토

## 결과

- 차트 색상이 모든 환경에서 안정적으로 렌더링
- `bignumber.js`로 숫자 소수점 2자리 버림 처리도 함께 적용
- 다크 모드 지원 시 ADR 업데이트 필요
