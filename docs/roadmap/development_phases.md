# Development Phases

## Phase 1 — Project Foundation
**Advisors: Software Architect, Security Engineer**

### Goals
Establish project structure, authentication, and database connection.

### Tasks
- Initialize Next.js 15 project (App Router, TypeScript strict)
- Configure Tailwind CSS and shadcn/ui
- Connect PostgreSQL via Prisma (Supabase)
- Implement NextAuth.js with Google OAuth
- Define DB schema: User, UploadedFile, Transaction, Category, Budget, UserCorrection
- Set up environment variable structure (.env.local, .env.example)
- Define folder structure: `src/modules/{auth,transactions,files,ai,budget}`

### Exit Criteria
- User can sign in with Google
- Prisma migrations run successfully against Supabase
- All secrets loaded from environment variables

---

## Phase 2 — File Upload & Transaction Parsing
**Advisors: Backend Developer, Data Engineer, Security Engineer**

### Goals
Accept XLSX/CSV uploads and produce normalized transaction records in the DB.

### Tasks
- Build file upload API Route (multipart/form-data)
- Integrate SheetJS (XLSX/XLS) and PapaParse (CSV)
- Implement automatic column detection
- Build manual column mapping UI
- Normalize amounts (handle negative/positive, currency symbols) and dates
- Detect and skip duplicate transactions (hash-based fingerprint)
- Validate file type (MIME + extension) and enforce size limits
- Delete source file from server after successful parsing
- Save normalized transactions to DB (raw fields preserved)

### Exit Criteria
- Uploading a valid XLSX or CSV produces persisted transaction rows
- Duplicate uploads do not create duplicate records
- Source file is deleted after parsing

---

## Phase 3 — AI Transaction Classification
**Advisors: AI Engineer, Backend Developer**

### Goals
Automatically categorize transactions using hybrid classification.

### Tasks
- Build rule-based classifier (keyword/merchant pattern matching)
- Integrate Claude API (claude-sonnet-4-6) as fallback classifier
- Batch API requests to max 50 transactions per call
- Cache classification results by transaction fingerprint
- Skip reclassification for unchanged transactions
- Store AI-generated category separately from raw transaction data
- Include confidence score per classification result
- Build subscription detection logic (recurring transactions)
- Implement user correction storage (UserCorrection table)
- Apply user corrections as highest-priority classification on future runs

### Exit Criteria
- Transactions are categorized after upload without user action
- User corrections persist and apply to new uploads
- No raw transaction fields are modified by AI classification

---

## Phase 4 — Dashboard & Visualization
**Advisors: Frontend Developer, UI/UX Designer**

### Goals
Display meaningful financial insights on a responsive dashboard.

### Tasks
- Monthly summary cards (total income, total expenses, net savings)
- Category breakdown pie chart (Recharts)
- Monthly spending trend line chart (Recharts)
- Top spending categories list
- Detected subscriptions list
- Date range filter
- Responsive layout (mobile-friendly)

### Exit Criteria
- Dashboard loads in under 2 seconds
- Charts reflect actual transaction data
- Filters update charts without page reload

# Phase 4.1 — Dashboard & UX Improvements

## Completed

- Transaction detail modal
- Dashboard loading skeletons
- Mobile bottom navigation
- Upload history

## Current Status
Completed and pushed to remote repository.

## Remaining
- Financial Health Card
- Goals Page
- Smart Rules System

---

## Phase 5 — Budget Management & AI Reports
**Advisors: Product Manager, AI Engineer, Frontend Developer**

### Goals
Enable budget tracking and generate AI-written financial summaries.

### Tasks
- Budget setup UI (per category, per month)
- Budget vs. actual comparison display
- Over-budget warning indicators
- AI monthly financial summary generation (Claude API)
- Spending pattern analysis text output
- Savings recommendation generation
- Store generated reports with timestamp

### Exit Criteria
- User can set a monthly budget per category
- AI report is generated for any selected month
- Reports are saved and viewable in history

---

## Phase 6 — Security Hardening & Deployment
**Advisors: Security Engineer, QA Engineer, Software Architect**

### Goals
Harden security, validate quality, and ship to production.

### Tasks
- Apply AES-256-GCM encryption to sensitive transaction fields
- Implement user data deletion (full account wipe)
- Add rate limiting to upload and AI API routes
- Write integration tests: upload → parse → classify → dashboard
- Write unit tests for parser, classifier, and budget logic
- Configure Vercel production deployment
- Connect Supabase production database
- Set all production environment variables
- Verify HTTPS enforcement end-to-end

### Exit Criteria
- All MVP features work in production
- Sensitive fields are encrypted at rest
- Upload processing completes under 10 seconds
- No secrets present in source code or logs
