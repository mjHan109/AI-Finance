# AI Insights Architecture

Status: Proposed
Target: Phase 5-A

---

## Current State

`/api/ai/insights` exists and calls Claude Haiku with a spending summary prompt.
- 24-hour cache via `AiReport` table
- Returns `string[]` of Korean insight sentences
- No deterministic pre-processing

**Problem:** Claude is doing both analysis AND formatting. If Claude returns nothing useful (low-data months, API errors), the user sees an empty card.

---

## Proposed: Deterministic Rules Layer

Add a deterministic insight engine that runs BEFORE Claude. This provides:
1. Guaranteed non-empty insights even when Claude API is unavailable
2. Precise threshold-based rules (Claude tends to be vague about numbers)
3. Reduced Claude usage (skip API call if deterministic insights are sufficient)

---

## Deterministic Insight Rules

### Rule Definitions

```typescript
// src/modules/insights/deterministic.ts

export interface InsightRule {
  id: string;
  severity: "info" | "warning" | "alert";
  check: (data: InsightData) => string | null; // null = rule not triggered
}

export interface InsightData {
  year: number;
  month: number;
  income: number;
  expense: number;
  prevExpense: number | null;     // last month's total expense
  savingsRate: number | null;     // (income - expense) / income * 100
  prevSavingsRate: number | null;
  categoryBreakdown: { name: string; amount: number; budget: number | null }[];
  subscriptionTotal: number;      // sum of isSubscription=true transactions
  prevSubscriptionTotal: number | null;
}
```

### Rule Set

| ID | Trigger | Example Output |
|----|---------|----------------|
| `savings_decline` | savingsRate < 10% | "이번 달 저축률이 8%로 낮습니다. 지출을 줄여 20% 이상을 목표로 해보세요." |
| `savings_negative` | savingsRate < 0 | "이번 달 지출이 수입을 초과했습니다. 적자 ${abs}원입니다." |
| `spending_increase` | expense > prevExpense * 1.2 | "지난달 대비 지출이 24% 증가했습니다." |
| `budget_overrun` | any category spent > budget * 1.0 | "식비 예산을 32,000원 초과했습니다." |
| `top_category_spike` | any category > 40% of total expense | "쇼핑이 전체 지출의 45%를 차지합니다." |
| `subscription_increase` | subscriptionTotal > prevSubscriptionTotal * 1.15 | "구독/통신 지출이 지난달보다 18% 늘었습니다." |
| `no_budget_set` | categoryBreakdown has items with budget=null | "예산이 설정되지 않은 카테고리가 3개 있습니다." |
| `healthy_savings` | savingsRate >= 30 | "이번 달 저축률 31%, 훌륭합니다!" |

### Updated API Flow

```
POST /api/ai/insights
  1. Auth check
  2. Check AiReport cache (24h TTL) → return if fresh
  3. Fetch current + previous month spending data
  4. Run deterministic rules → collect triggered insights
  5. If deterministic insights >= 3:
       Skip Claude API, return deterministic insights (mark source: "rule")
  6. Else:
       Call Claude Haiku with spending context
       Merge Claude insights with deterministic insights
       Deduplicate
  7. Cache result in AiReport
  8. Return { insights: string[], source: "rule" | "ai" | "mixed", cached: boolean }
```

### Data Fetch for Previous Month

Currently only current month is fetched. Need to add:

```typescript
// Fetch previous month in same query batch
const prevStart = new Date(year, month - 2, 1);
const prevEnd   = new Date(year, month - 1, 0, 23, 59, 59);
const prevExpenseAgg = await prisma.transaction.aggregate({
  where: { userId, isExcluded: false, isIncome: false, date: { gte: prevStart, lte: prevEnd } },
  _sum: { amount: true },
});
```

---

## Schema Change — None Required

`AiReport.content` currently stores `string[]`. Change to store structured JSON:

```typescript
// New content shape (backwards compatible — JSON.parse still works)
interface AiReportContent {
  insights: string[];
  source: "rule" | "ai" | "mixed";
  generatedAt: string; // ISO timestamp
}
```

No Prisma migration needed. `content String` field can store any JSON.

---

## What NOT to Build Yet

- Per-transaction anomaly detection (requires historical baseline)
- Predictive spending forecasts (requires 3+ months of data)
- Push notification triggers from insights (requires VAPID + Phase 2)
- Real-time streaming insights (no background workers)

---

## Implementation Order

1. Create `src/modules/insights/deterministic.ts` with rule set
2. Update `src/app/api/ai/insights/route.ts` to run deterministic rules first
3. Add previous month data fetch to insight query
4. Update response shape to include `source` field
5. (Optional) Surface `source` in UI — show "AI 분석" vs "자동 분석" badge
