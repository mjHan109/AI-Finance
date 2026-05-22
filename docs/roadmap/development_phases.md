# Development Phases

# Phase 1 — Project Foundation

## Completed
- Next.js 15 setup, Tailwind CSS, shadcn/ui
- PostgreSQL + Prisma ORM
- NextAuth v5: Google OAuth + email/password login

---

# Phase 2 — File Upload & Transaction Parsing

## Completed
- XLSX/CSV upload (SheetJS + PapaParse)
- KB Bank + BankSalad format support
- Duplicate detection, transaction normalization

---

# Phase 3 — Core Finance Features

## Completed
- Account, Category, Transaction, Budget, Reports, Reclassification APIs

---

# Phase 4 — Dashboard & UX

## Completed
- Transaction detail modal with category edit + memo
- Dashboard loading skeletons
- Mobile bottom navigation
- Upload history page
- Financial Health Card (score, tips, gauge)
- Goals page: D-day, monthly savings target, progress bar, completion animation, calendar popover
- Logout page + mobile logout action

---

# Phase 5 — AI Features

## Completed
- Claude API integration (/api/ai/insights)
- Deterministic insight engine + LLM monthly summary
- AI Insight Cards on dashboard
- LLM prompt includes flow-aware breakdown (consumption/savings/investment/transfer)

## Remaining
- Subscription detection
- Anomaly / spending pattern alerts

---

# Phase 6 — Security & Production Hardening

## Completed
- Security headers: CSP, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- Rate limiting: signup (10/5min), reclassify (60s), reports (1/10s), budgets (1/5s)
- Upload security: MIME check, magic bytes, size limit (10 MB), filename sanitization
- Zod schema validation (src/lib/schemas.ts)
- Route protection: src/proxy.ts (Next.js 16 proxy convention)
  - Checks authjs.session-token / __Secure-authjs.session-token
  - AUTH_ROUTES constant as single source of truth (src/lib/auth-routes.ts)
- Logout: relative callbackUrl resolves correctly in production
- E2E: 38 tests (auth, API security, upload, pages, logout)
- Unit tests: 25 tests (flow calculation, category mapping)
- vitest.config.ts scoped to src/ only

## Remaining
- Structured audit logging (login, upload, AI call events)
- Cascade delete (orphan prevention on account/goal delete)
- Brute-force protection on /api/auth/signin
- At-rest encryption for rawDescription, memo, account names

---

# Phase 7 — Financial Semantics & Flow Classification

## Completed
- CategoryFlowType: CONSUMPTION | SAVINGS | INVESTMENT | TRANSFER
- src/lib/flow.ts: computeFlowSummary — single authoritative function used across all 4 surfaces
  - Savings Rate = (savings + investment) / income
  - TRANSFER excluded from all metrics
- Apples-to-apples expenseChange: both months filtered to CONSUMPTION only
- Health score prevConsumption now flow-filtered
- BankSalad map extended: 저축/적금/예금 → SAVINGS, 투자 → INVESTMENT
- Dashboard metric sublabels: "저축·이체 제외", "수입 − 소비 − 저축", "(저축+투자) / 수입"
- 15 categories seeded to production DB with correct flowType values

---

# Phase 8 — Mobile Strategy (Planned)

- Phase 8A: PWA (next-pwa, manifest.json, service worker, home screen install)
- Phase 8B: API standardization (response format, CORS, env cleanup)
- Phase 8C: React Native Expo in separate podo-mobile repo (never add RN to this repo)
