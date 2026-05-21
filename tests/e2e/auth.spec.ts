import { test, expect } from "@playwright/test";

/**
 * Authentication E2E tests
 * Covers: redirect behaviour, login page structure, signup inline validation
 */

test.describe("Authentication", () => {
  test("unauthenticated user is redirected from /dashboard to /login", async ({ page }) => {
    await page.goto("/dashboard");
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });

  test("login page renders email and password fields", async ({ page }) => {
    await page.goto("/login");
    await expect(page.locator("#login-email")).toBeVisible();
    await expect(page.locator("#login-password")).toBeVisible();
    await expect(page.getByRole("button", { name: "로그인" })).toBeVisible();
  });

  test("signup form shows inline mismatch error when passwords differ", async ({ page }) => {
    await page.goto("/login");

    // Switch to signup tab
    await page.getByRole("tab", { name: "회원가입" }).click();

    // Fill all required fields with a valid password
    await page.locator("#signup-name").fill("테스트유저");
    await page.locator("#signup-email").fill("test@example.com");
    await page.locator("#signup-password").fill("Password1!");   // meets all rules
    await page.locator("#signup-confirm").fill("DifferentPass1!");

    // Inline mismatch message appears without needing to submit
    await expect(page.locator("text=비밀번호가 일치하지 않습니다")).toBeVisible();
  });
});
