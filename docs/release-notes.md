# Release Notes

## v0.5.0 — Financial Semantics + Security Hardening (2026-05-22)

### What's New

**Flow-aware financial classification (Phase 7)**
- New `CategoryFlowType` enum: CONSUMPTION | SAVINGS | INVESTMENT | TRANSFER
- `src/lib/flow.ts` — single `computeFlowSummary()` function used by all data surfaces
- Savings Rate = (savings + investment) / income, not (income − expense) / income
- Card payments and internal transfers (TRANSFER) excluded from consumption metrics
- All four surfaces consistent: dashboard, reports, health score, AI insights
- BankSalad CSV imports now correctly classify 저축/적금/예금 → SAVINGS, 투자 → INVESTMENT
- Dashboard metric sublabels explain each number's semantics

**Goals page improvements**
- Calendar popover using createPortal (no overflow clipping)
- D-day display with amber/red urgency coloring
- Monthly required savings calculation
- Completion animation (trophy + bounce)
- Inline form validation

**Logout fix**
- Production 404 after logout resolved
- Root cause: proxy.ts had wrong NextAuth v5 cookie names (authjs.* not next-auth.*)
- callbackUrl changed to relative path ("/login") — resolves correctly in any environment

**Security**
- Route protection via src/proxy.ts (Next.js 16 uses proxy.ts, not middleware.ts)
- AUTH_ROUTES constant centralizes /login and /dashboard paths
- Correct session cookie detection: authjs.session-token / __Secure-authjs.session-token

**Testing**
- 25 unit tests: computeFlowSummary (10), BankSalad category mapping + flowType invariants (15)
- 38 E2E tests: all protected pages, all protected APIs, logout no-404, custom 404
- vitest.config.ts scoped to src/ to avoid playwright test file conflicts

### Fixes
- Chart bar colors: hardcoded hex (#34d399, #f87171) — Recharts can't parse CSS var fallbacks
- Recharts gray hover overlay removed (cursor={false})
- Calendar popover clipping on Goals page
- health/route.ts prevConsumption now flow-filtered (was raw total)
- reports/route.ts expenseChange now apples-to-apples (CONSUMPTION only both months)

### Known Limitations
- xlsx package: 1 high + 6 moderate CVEs, no upstream fix available
  - Mitigation: file size limit (10 MB), MIME + magic byte validation, no user-supplied formula execution
- AUTH_URL: verify set in Vercel env vars (NextAuth v5 falls back to VERCEL_URL if unset)
- BankSalad whitespace variants ("저축 / 적금" with spaces) not mapped — falls to null
- Uncategorized transactions default flowType to CONSUMPTION
- No audit logging yet (login events, upload events, AI calls)

---

## v0.4.0 — AI Insights + API Hardening (2026-05-21)

- Claude API integration (/api/ai/insights)
- Deterministic insight engine + LLM monthly summary
- Zod schema validation (src/lib/schemas.ts)
- Encryption helpers (src/lib/encryption.ts AES-256-GCM)
- Rate limiting on all high-risk endpoints
- Upload security hardening (MIME, magic bytes, filename sanitization)
- Initial E2E test suite with Playwright

---

## v0.3.0 — Dashboard & Mobile UX (Phase 4)

- Transaction detail modal (category edit, memo, exclude toggle)
- Loading skeletons across all dashboard pages
- Mobile bottom navigation bar
- Upload history page with delete

---

## v0.2.0 — Core Finance Features (Phase 3)

- Accounts, Categories, Transactions, Budgets, Reports APIs
- Reclassification API with 60s cooldown

---

## v0.1.0 — Foundation (Phases 1–2)

- Next.js 16 + Tailwind + shadcn/ui
- Supabase PostgreSQL + Prisma
- NextAuth v5 (credentials + Google OAuth)
- XLSX/CSV upload and parsing (KB Bank, BankSalad formats)
