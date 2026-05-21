import { test, expect } from "@playwright/test";

/**
 * API Security E2E tests
 * Covers: protected endpoints block unauthenticated requests
 *
 * Some routes are guarded by Next.js middleware (307 redirect to /login).
 * Others return 401 directly from the route handler.
 * Both are valid "access denied" responses — we accept either.
 */

const PROTECTED_ENDPOINTS = [
  "/api/accounts",
  "/api/budgets",
  "/api/categories",
  "/api/goals",
  "/api/health",
  "/api/reports",
  "/api/transactions",
  "/api/upload/history",
];

test.describe("API security — unauthenticated requests", () => {
  for (const endpoint of PROTECTED_ENDPOINTS) {
    test(`GET ${endpoint} blocks unauthenticated access`, async ({ request }) => {
      // Disable redirect-following so middleware 307s aren't silently converted to 200
      const res = await request.get(endpoint, { maxRedirects: 0 });
      const status = res.status();

      // Accept 401 (route-level auth) or 307 (middleware redirect to /login)
      expect([401, 307]).toContain(status);

      if (status === 401) {
        const body = await res.json();
        expect(body).toHaveProperty("error");
      }
    });
  }

  test("POST /api/auth/signup with invalid email returns 400", async ({ request }) => {
    const res = await request.post("/api/auth/signup", {
      data: { name: "테스트", email: "not-an-email", password: "Password1!" },
    });
    expect(res.status()).toBe(400);
  });

  test("POST /api/auth/signup with missing fields returns 400", async ({ request }) => {
    const res = await request.post("/api/auth/signup", {
      data: { email: "test@example.com" },
    });
    expect(res.status()).toBe(400);
  });
});
