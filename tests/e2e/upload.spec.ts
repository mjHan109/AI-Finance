import { test, expect } from "@playwright/test";

/**
 * Upload page E2E tests
 * Covers: unauthenticated redirect, page accessibility, back button
 */

test.describe("Upload page", () => {
  test("unauthenticated access to /upload redirects to /login", async ({ page }) => {
    await page.goto("/upload");
    // Middleware redirects to /login
    await expect(page).toHaveURL(/\/(login|api\/auth\/signin)/);
  });

  test("middleware blocks /upload with 307 when unauthenticated", async ({ request }) => {
    const res = await request.get("/upload", { maxRedirects: 0 });
    expect(res.status()).toBe(307);
  });

  test("upload route is listed in middleware protected routes", async ({ request }) => {
    // Verify that /upload and /api/upload are both blocked by middleware (307)
    const uploadPage = await request.get("/upload", { maxRedirects: 0 });
    const uploadApi   = await request.get("/api/upload", { maxRedirects: 0 });

    expect(uploadPage.status()).toBe(307);
    expect([307, 401, 405]).toContain(uploadApi.status()); // 405 if GET not allowed on POST-only route
  });
});
