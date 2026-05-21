# Security Checklist

**Goal:** Ensure the AI finance application securely handles Authentication, Financial data, File uploads, AI integrations, and API access.

Legend: ✅ Done · ⬜ Pending · 🔜 Future

---

## 1. Authentication Security

| Item | Status |
|------|--------|
| Use AUTH_SECRET / NEXTAUTH_SECRET | ✅ |
| Hash passwords using bcrypt (bcryptjs) | ✅ |
| Prevent brute force login attempts (rate limiting on signup) | ✅ |
| Enforce HTTPS in production | ✅ Vercel enforces HTTPS |
| Use secure session cookies | ✅ NextAuth v5 default |
| Set session expiration policy | ✅ NextAuth default |
| Confirm Google OAuth callback URLs | ⬜ Not using Google OAuth yet |
| Confirm auth environment variables are not exposed | ✅ .env excluded from git |

---

## 2. Authorization & Access Control

| Item | Status |
|------|--------|
| Verify session.user.id for every protected API | ✅ All routes check session |
| Prevent access to other users' data | ✅ `where: { id, userId }` pattern applied |
| Ownership validation — Accounts | ✅ |
| Ownership validation — Transactions | ✅ |
| Ownership validation — Budgets | ✅ |
| Ownership validation — Goals | ✅ |
| Ownership validation — Upload history | ✅ |
| Ownership validation — Reports | ✅ |

---

## 3. File Upload Security

| Item | Status |
|------|--------|
| Allow only .xlsx / .xls / .csv | ✅ Extension + MIME check |
| Validate magic bytes (file signature) | ✅ |
| Sanitize filenames | ✅ |
| Enforce file size limits | ✅ 10 MB limit |
| Reject malformed files | ✅ Parser throws on bad data |
| Prevent executable uploads | ✅ Allowlist-only MIME types |
| Store uploads outside public directories | ✅ Processed in memory, not stored on disk |
| Delete source files after successful parsing | ✅ Files not persisted; only parsed rows saved |
| Malware scanning | 🔜 Future |

---

## 4. API Security

| Item | Status |
|------|--------|
| Rate limiting on /api/auth/signup | ✅ 10/5min per IP |
| Rate limiting on /api/reclassify | ✅ 60s cooldown per user (DB-based) |
| Rate limiting on /api/reports | ✅ 1/10s per user |
| Rate limiting on /api/budgets | ✅ 1/5s per user |
| Validate all request bodies | ✅ Manual validation on all POST/PATCH |
| Validate query parameters | ✅ search capped 100 chars, categoryId UUID-validated |
| Sanitize memo field server-side | ✅ strips `< > " ' \`` |
| Prevent mass assignment | ✅ explicit field allowlists |
| Prevent SQL injection | ✅ Prisma parameterized queries |
| Prevent XSS via headers | ✅ CSP + X-Content-Type-Options |
| try/catch on all API routes | ✅ |
| Zod schema validation | ⬜ Manual validation used; Zod not added yet |

---

## 5. Financial Data Protection

| Item | Status |
|------|--------|
| Encrypt data in transit | ✅ HTTPS / TLS |
| Never expose raw database access to clients | ✅ All access via API routes |
| Separate raw transaction data from AI-generated data | ✅ `classifiedBy` field tracks source |
| Encrypt sensitive data at rest (AES-256-GCM) | 🔜 Not yet implemented |
| Encrypted fields: rawDescription, memo, account names | 🔜 Future |

---

## 6. AI Security

| Item | Status |
|------|--------|
| Do not send unnecessary personal data to AI APIs | ✅ Only descriptions sent |
| Preserve original transaction data | ✅ `rawDescription` stored separately |
| Store AI confidence scores | ⬜ `classifiedBy` stored; confidence score not yet |
| Validate AI responses before saving | ✅ Category IDs validated before DB write |
| Batch AI requests | ✅ Reclassify batches all transactions |
| Prevent repeated AI processing (rate limit) | ✅ 60s cooldown |

---

## 7. Environment Variable Security

| Item | Status |
|------|--------|
| DATABASE_URL not exposed to client | ✅ |
| AUTH_SECRET not exposed to client | ✅ |
| ANTHROPIC_API_KEY not exposed to client | ✅ |
| .env excluded from git | ✅ .gitignore |

---

## 8. Logging & Monitoring

| Item | Status |
|------|--------|
| Do not log sensitive financial data | ✅ Only errors logged |
| Do not log secrets or tokens | ✅ |
| Log login attempts | ⬜ |
| Log upload attempts | ⬜ |
| Log AI processing failures | ⬜ |
| Structured logging / monitoring service | 🔜 Future |

---

## 9. Production Deployment Security

| Item | Status |
|------|--------|
| HTTPS only | ✅ Vercel |
| Security headers: Content-Security-Policy | ✅ |
| Security headers: X-Frame-Options (DENY) | ✅ |
| Security headers: X-Content-Type-Options (nosniff) | ✅ |
| Security headers: Referrer-Policy | ✅ |
| Security headers: Permissions-Policy | ✅ |
| Hide internal error details | ✅ Generic 500 messages |
| TypeScript strict mode (no ignoreBuildErrors) | ✅ |

---

## 10. Data Deletion Policy

| Item | Status |
|------|--------|
| Delete transactions | ✅ via PATCH isExcluded or direct delete |
| Delete uploaded files (record) | ⬜ No delete endpoint yet |
| Delete budgets | ✅ POST with amount=0 effectively removes |
| Delete accounts | ✅ DELETE /api/accounts |
| Delete goals | ✅ DELETE /api/goals/[id] |
| Prevent orphaned records on delete | ⬜ Cascade rules not fully defined |

---

## 11. Rate Limiting Coverage

| Endpoint | Limit | Status |
|----------|-------|--------|
| /api/auth/signup | 10/5min per IP | ✅ |
| /api/upload | File size + parse validation | ✅ |
| /api/reclassify | 60s cooldown per user | ✅ |
| /api/reports | 1/10s per user | ✅ |
| /api/budgets | 1/5s per user | ✅ |
| /api/auth/signin (brute force) | NextAuth default | ⬜ Add explicit limit |

---

## 12. Security Testing

| Item | Status |
|------|--------|
| Authorization testing (401 for unauthenticated) | ✅ E2E tests added |
| Upload validation testing | ⬜ |
| Session security testing | ⬜ |
| API abuse / rate limit testing | ⬜ |
| OWASP API Security Top 10 review | ⬜ |
| npm audit | ⬜ Run before each release |

---

## Priority Backlog

**Critical (blocking production)**
- Structured logging / audit trail
- Cascade delete policy (orphan prevention)

**High Priority**
- Zod schema validation on all API inputs
- Upload file delete endpoint
- Brute-force protection on signin

**Future**
- At-rest encryption for sensitive fields
- Malware scanning on uploads
- Anomaly detection
