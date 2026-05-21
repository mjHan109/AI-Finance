import { test, expect } from "@playwright/test";

/**
 * Page-level E2E tests
 * Covers: 404 page, protected page redirects, login page UI
 */

test.describe("404 and error pages", () => {
  test("unknown route shows 404 page content", async ({ page }) => {
    const res = await page.goto("/this-page-does-not-exist-at-all");
    // Next.js may return 200 with custom not-found UI or actual 404
    expect([200, 404]).toContain(res?.status() ?? 200);
    // Custom not-found page text
    await expect(
      page.locator("text=페이지를 찾을 수 없어요").or(page.locator("text=404")),
    ).toBeVisible({ timeout: 5000 });
  });

  test("unknown API route returns 404", async ({ request }) => {
    const res = await request.get("/api/nonexistent-endpoint");
    expect(res.status()).toBe(404);
  });
});

test.describe("Protected page redirects", () => {
  test("unauthenticated /dashboard redirects to login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });

  test("unauthenticated /dashboard/reports redirects to login", async ({ page }) => {
    await page.goto("/dashboard/reports");
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });

  test("unauthenticated /dashboard/budgets redirects to login", async ({ page }) => {
    await page.goto("/dashboard/budgets");
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });

  test("unauthenticated /dashboard/goals redirects to login", async ({ page }) => {
    await page.goto("/dashboard/goals");
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });

  test("unauthenticated /dashboard/accounts redirects to login", async ({ page }) => {
    await page.goto("/dashboard/accounts");
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });
});

test.describe("Login page UI", () => {
  test("login page has both login and signup tabs", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByRole("tab", { name: "로그인" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "회원가입" })).toBeVisible();
  });

  test("signup tab shows all required fields", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("tab", { name: "회원가입" }).click();

    await expect(page.locator("#signup-name")).toBeVisible();
    await expect(page.locator("#signup-email")).toBeVisible();
    await expect(page.locator("#signup-password")).toBeVisible();
    await expect(page.locator("#signup-confirm")).toBeVisible();
  });

  test("login page does not contain sensitive placeholders or debug info", async ({ page }) => {
    await page.goto("/login");
    const content = await page.content();
    expect(content).not.toContain("process.env");
    expect(content).not.toContain("DATABASE_URL");
    expect(content).not.toContain("ANTHROPIC_API_KEY");
  });
});
