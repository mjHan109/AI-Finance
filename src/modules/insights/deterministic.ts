/**
 * Deterministic Insight Engine
 *
 * Generates financial insights from spending data without calling Claude.
 * Rules are threshold-based, explainable, and run in O(n) time.
 *
 * Priority order (for display): alert → warning → info/positive
 * Maximum returned: configurable via maxInsights (default 3)
 */

export type InsightSeverity = "alert" | "warning" | "info" | "positive";

export interface Insight {
  id: string;
  severity: InsightSeverity;
  icon: string;
  message: string;
  recommendation?: string;
}

export interface InsightInput {
  income: number;
  expense: number;
  /** Previous month total expense. null = no prior data available. */
  prevExpense: number | null;
  /** (income - expense) / income * 100, or null if income === 0 */
  savingsRate: number | null;
  /** Per-category expense breakdown for the current month */
  categoryBreakdown: { name: string; amount: number }[];
  /** Categories that exceeded their budget */
  overBudgetItems: { categoryName: string; spent: number; budget: number }[];
  /** Total number of budget items set for the month */
  budgetSetCount: number;
}

// ─── Rule implementations ─────────────────────────────────────────────────────

function ruleSavingsNegative(d: InsightInput): Insight | null {
  if (d.income === 0) return null;
  if (d.expense <= d.income) return null;
  const deficit = d.expense - d.income;
  return {
    id: "savings_negative",
    severity: "alert",
    icon: "⚠️",
    message: `이번 달 지출이 수입보다 ${deficit.toLocaleString()}원 더 많아요.`,
    recommendation: "고정 지출을 검토하고 절약 가능한 항목을 찾아보세요.",
  };
}

function ruleBudgetOverrun(d: InsightInput): Insight | null {
  if (d.overBudgetItems.length === 0) return null;
  if (d.overBudgetItems.length === 1) {
    const item = d.overBudgetItems[0];
    const over = item.spent - item.budget;
    return {
      id: "budget_overrun",
      severity: "alert",
      icon: "📊",
      message: `${item.categoryName} 예산을 ${over.toLocaleString()}원 초과했어요.`,
      recommendation: "다음 달 예산을 조정하거나 해당 카테고리 지출을 줄여보세요.",
    };
  }
  return {
    id: "budget_overrun",
    severity: "alert",
    icon: "📊",
    message: `${d.overBudgetItems.length}개 카테고리에서 예산을 초과했어요.`,
    recommendation: "예산 페이지에서 초과 현황을 확인하고 다음 달 계획을 세워보세요.",
  };
}

function ruleSpendingIncrease(d: InsightInput): Insight | null {
  if (d.prevExpense === null || d.prevExpense === 0) return null;
  const changeRate = (d.expense - d.prevExpense) / d.prevExpense;
  if (changeRate < 0.2) return null;
  const pct = Math.round(changeRate * 100);
  return {
    id: "spending_increase",
    severity: "warning",
    icon: "📈",
    message: `지난달 대비 지출이 ${pct}% 늘었어요.`,
    recommendation: "어떤 카테고리에서 지출이 늘었는지 거래 내역에서 확인해보세요.",
  };
}

function ruleSavingsDecline(d: InsightInput): Insight | null {
  if (d.savingsRate === null) return null;
  if (d.income === 0) return null;
  // Don't double-trigger with savings_negative
  if (d.expense > d.income) return null;
  if (d.savingsRate >= 10) return null;
  return {
    id: "savings_decline",
    severity: "warning",
    icon: "💰",
    message: `이번 달 저축률이 ${d.savingsRate}%예요. 목표 저축률을 높여볼 수 있어요.`,
    recommendation: "저축률 20% 이상을 목표로 설정해보세요.",
  };
}

function ruleTopCategorySpike(d: InsightInput): Insight | null {
  if (d.expense === 0 || d.categoryBreakdown.length === 0) return null;
  const top = d.categoryBreakdown.reduce((a, b) => (a.amount > b.amount ? a : b));
  const pct = Math.round((top.amount / d.expense) * 100);
  if (pct < 40) return null;
  return {
    id: "top_category_spike",
    severity: "warning",
    icon: "🔍",
    message: `${top.name}이(가) 전체 지출의 ${pct}%를 차지하고 있어요.`,
    recommendation: `${top.name} 지출 내역을 살펴보고 불필요한 항목이 있는지 확인해보세요.`,
  };
}

function ruleNoBudgetSet(d: InsightInput): Insight | null {
  if (d.budgetSetCount > 0) return null;
  if (d.expense === 0) return null;
  return {
    id: "no_budget_set",
    severity: "info",
    icon: "🎯",
    message: "예산이 아직 설정되지 않았어요.",
    recommendation: "카테고리별 예산을 설정하면 지출 관리가 훨씬 쉬워져요.",
  };
}

function ruleHealthySavings(d: InsightInput): Insight | null {
  if (d.savingsRate === null) return null;
  if (d.savingsRate < 30) return null;
  return {
    id: "healthy_savings",
    severity: "positive",
    icon: "✨",
    message: `이번 달 저축률이 ${d.savingsRate}%예요. 훌륭한 재정 관리를 하고 있어요!`,
  };
}

function ruleSpendingDecrease(d: InsightInput): Insight | null {
  if (d.prevExpense === null || d.prevExpense === 0) return null;
  const changeRate = (d.expense - d.prevExpense) / d.prevExpense;
  if (changeRate > -0.1) return null;
  const pct = Math.round(Math.abs(changeRate) * 100);
  return {
    id: "spending_decrease",
    severity: "positive",
    icon: "👍",
    message: `지난달보다 지출을 ${pct}% 줄였어요. 좋은 흐름이에요!`,
  };
}

// ─── Ordered rule list (defines evaluation order, not display order) ──────────

const RULES = [
  ruleSavingsNegative,
  ruleBudgetOverrun,
  ruleSpendingIncrease,
  ruleSavingsDecline,
  ruleTopCategorySpike,
  ruleNoBudgetSet,
  ruleHealthySavings,
  ruleSpendingDecrease,
] as const;

// ─── Severity sort order ──────────────────────────────────────────────────────

const SEVERITY_ORDER: Record<InsightSeverity, number> = {
  alert:    0,
  warning:  1,
  info:     2,
  positive: 3,
};

// ─── Public API ───────────────────────────────────────────────────────────────

export interface GenerateInsightsOptions {
  maxInsights?: number;
}

export function generateInsights(
  input: InsightInput,
  options: GenerateInsightsOptions = {}
): Insight[] {
  const { maxInsights = 3 } = options;

  const triggered: Insight[] = [];
  for (const rule of RULES) {
    const result = rule(input);
    if (result) triggered.push(result);
  }

  // Sort by severity: alert → warning → info → positive
  triggered.sort(
    (a, b) => SEVERITY_ORDER[a.severity] - SEVERITY_ORDER[b.severity]
  );

  return triggered.slice(0, maxInsights);
}
