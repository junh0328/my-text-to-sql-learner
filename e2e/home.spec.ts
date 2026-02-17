import { expect, test } from "@playwright/test";

test.describe("홈페이지 기본 렌더링", () => {
  test("타이틀과 주요 UI 요소가 표시된다", async ({ page }) => {
    // API key 설정하여 다이얼로그 방지
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("google_ai_api_key", "test-key");
    });
    await page.reload();

    // 타이틀 확인
    await expect(page).toHaveTitle("Text-to-SQL Learner");

    // 헤더 텍스트 확인
    await expect(
      page.getByRole("heading", { name: "Ask to DB!" }),
    ).toBeVisible();

    // 질문 입력창 확인
    await expect(
      page.getByPlaceholder("데이터에 대해 질문해보세요..."),
    ).toBeVisible();

    // 질문하기 버튼 확인
    await expect(page.getByRole("button", { name: "질문하기" })).toBeVisible();

    // 예시 질문 버튼들 확인
    await expect(
      page.getByRole("button", { name: "도시별 고객 수는?" }),
    ).toBeVisible();
    await expect(
      page.getByRole("button", { name: "월별 매출 추이 보여줘" }),
    ).toBeVisible();
  });

  test("API Key가 없으면 다이얼로그가 표시된다", async ({ page }) => {
    await page.goto("/");

    // localStorage에 키가 없으므로 다이얼로그가 표시되어야 함
    await expect(page.getByRole("dialog")).toBeVisible();
  });

  test("빈 질문으로는 제출할 수 없다", async ({ page }) => {
    await page.goto("/");

    // API Key 다이얼로그가 뜨면 닫기 위해 키 입력
    const dialog = page.getByRole("dialog");
    if (await dialog.isVisible()) {
      // API key 입력 후 저장
      await page.evaluate(() => {
        localStorage.setItem("google_ai_api_key", "test-key");
      });
      await page.reload();
    }

    // 질문하기 버튼이 비활성화 상태인지 확인
    const submitButton = page.getByRole("button", { name: "질문하기" });
    await expect(submitButton).toBeDisabled();
  });

  test("예시 질문 버튼을 클릭하면 입력창에 텍스트가 채워진다", async ({
    page,
  }) => {
    // API key 설정 후 페이지 로드
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("google_ai_api_key", "test-key");
    });
    await page.reload();

    // 예시 질문 버튼 클릭
    await page.getByRole("button", { name: "도시별 고객 수는?" }).click();

    // 입력창에 텍스트가 채워졌는지 확인
    const input = page.getByPlaceholder("데이터에 대해 질문해보세요...");
    await expect(input).toHaveValue("도시별 고객 수는?");
  });

  test("Settings 버튼 클릭 시 API Key 다이얼로그가 열린다", async ({
    page,
  }) => {
    // API key가 있는 상태에서 시작
    await page.goto("/");
    await page.evaluate(() => {
      localStorage.setItem("google_ai_api_key", "test-key");
    });
    await page.reload();

    // Settings 아이콘 버튼 클릭
    await page.getByTitle("API Key 설정").click();

    // 다이얼로그 표시 확인
    await expect(page.getByRole("dialog")).toBeVisible();
  });
});
