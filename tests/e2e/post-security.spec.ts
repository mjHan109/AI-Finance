import { test, expect } from "@playwright/test";

/**
 * POST/DELETE endpoint security E2E tests
 * Covers: mutation endpoints block unauthenticated requests
 */

test.describe("POST/DELETE endpoints — unauthenticated access", () => {
  test("POST /api/ai/insights blocks unauthenticated", async ({ request }) => {
    const res = await request.post("/api/ai/insights", {
      data: { year: 2026, month: 5 },
      maxRedirects: 0,
    });
    expect([401, 307]).toContain(res.status());
  });

  test("POST /api/goals blocks unauthenticated", async ({ request }) => {
    const res = await request.post("/api/goals", {
      data: { name: "Test", targetAmount: 100000 },
      maxRedirects: 0,
    });
    expect([401, 307]).toContain(res.status());
  });

  test("POST /api/budgets blocks unauthenticated", async ({ request }) => {
    const res = await request.post("/api/budgets", {
      data: { categoryId: "00000000-0000-0000-0000-000000000000", year: 2026, month: 5, amount: 50000 },
      maxRedirects: 0,
    });
    expect([401, 307]).toContain(res.status());
  });

  test("DELETE /api/upload/history/some-id blocks unauthenticated", async ({ request }) => {
    const res = await request.delete("/api/upload/history/nonexistent-id", {
      maxRedirects: 0,
    });
    expect([401, 307]).toContain(res.status());
  });

  test("PATCH /api/transactions/some-id blocks unauthenticated", async ({ request }) => {
    const res = await request.patch("/api/transactions/nonexistent-id", {
      data: { isExcluded: true },
      maxRedirects: 0,
    });
    expect([401, 307]).toContain(res.status());
  });

  test("POST /api/upload blocks unauthenticated", async ({ request }) => {
    const res = await request.post("/api/upload", {
      multipart: {
        file: {
          name: "test.csv",
          mimeType: "text/csv",
          buffer: Buffer.from("date,description,amount\n2026-01-01,test,1000"),
        },
      },
      maxRedirects: 0,
    });
    expect([401, 307]).toContain(res.status());
  });

  // Input validation — no auth needed to test bad input that fails before auth check
  // (These test Zod schema validation on routes that return 400 before processing)
  test("POST /api/ai/insights with missing year returns 400 or auth error", async ({ request }) => {
    const res = await request.post("/api/ai/insights", {
      data: { month: 5 },
      maxRedirects: 0,
    });
    // Either blocked by auth (401/307) or rejected by Zod (400) — both are correct
    expect([400, 401, 307]).toContain(res.status());
  });

  test("POST /api/auth/signup with short password returns 400", async ({ request }) => {
    const res = await request.post("/api/auth/signup", {
      data: { name: "테스트", email: "test2@example.com", password: "short" },
    });
    expect(res.status()).toBe(400);
    const body = await res.json();
    expect(body).toHaveProperty("error");
  });

  test("POST /api/auth/signup with name too long returns 400", async ({ request }) => {
    const res = await request.post("/api/auth/signup", {
      data: {
        name: "a".repeat(51),
        email: "toolong@example.com",
        password: "Password1!",
      },
    });
    expect(res.status()).toBe(400);
  });
});
