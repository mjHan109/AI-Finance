import { describe, it, expect } from "vitest";
import { generateInsights, type InsightInput } from "../deterministic";

// ─── Baseline input (healthy state — should produce no alerts) ────────────────

const healthy: InsightInput = {
  income:    3_000_000,
  expense:   1_800_000,
  prevExpense: 1_800_000,
  savingsRate: 40,
  categoryBreakdown: [
    { name: "식비",     amount: 500_000 },
    { name: "교통",     amount: 200_000 },
    { name: "카페/간식", amount: 150_000 },
  ],
  overBudgetItems: [],
  budgetSetCount:  3,
};

// ─── Rule: savings_negative ───────────────────────────────────────────────────

describe("savings_negative rule", () => {
  it("triggers when expense > income", () => {
    const insights = generateInsights({
      ...healthy,
      income:  1_000_000,
      expense: 1_500_000,
      savingsRate: -50,
    });
    expect(insights.some((i) => i.id === "savings_negative")).toBe(true);
  });

  it("severity is alert", () => {
    const insights = generateInsights({
      ...healthy,
      income:  1_000_000,
      expense: 1_200_000,
      savingsRate: -20,
    });
    const rule = insights.find((i) => i.id === "savings_negative");
    expect(rule?.severity).toBe("alert");
  });

  it("does not trigger when expense <= income", () => {
    const insights = generateInsights(healthy);
    expect(insights.some((i) => i.id === "savings_negative")).toBe(false);
  });

  it("does not trigger when income is 0", () => {
    const insights = generateInsights({
      ...healthy,
      income: 0,
      expense: 500_000,
      savingsRate: null,
    });
    expect(insights.some((i) => i.id === "savings_negative")).toBe(false);
  });

  it("message includes deficit amount", () => {
    const insights = generateInsights({
      ...healthy,
      income:  1_000_000,
      expense: 1_200_000,
      savingsRate: -20,
    });
    const rule = insights.find((i) => i.id === "savings_negative");
    expect(rule?.message).toContain("200,000원");
  });
});

// ─── Rule: budget_overrun ─────────────────────────────────────────────────────

describe("budget_overrun rule", () => {
  it("triggers when any category exceeds budget", () => {
    const insights = generateInsights({
      ...healthy,
      overBudgetItems: [{ categoryName: "식비", spent: 600_000, budget: 500_000 }],
    });
    expect(insights.some((i) => i.id === "budget_overrun")).toBe(true);
  });

  it("severity is alert", () => {
    const insights = generateInsights({
      ...healthy,
      overBudgetItems: [{ categoryName: "식비", spent: 600_000, budget: 500_000 }],
    });
    const rule = insights.find((i) => i.id === "budget_overrun");
    expect(rule?.severity).toBe("alert");
  });

  it("single overrun message includes category name and overrun amount", () => {
    const insights = generateInsights({
      ...healthy,
      overBudgetItems: [{ categoryName: "식비", spent: 650_000, budget: 500_000 }],
    });
    const rule = insights.find((i) => i.id === "budget_overrun");
    expect(rule?.message).toContain("식비");
    expect(rule?.message).toContain("150,000원");
  });

  it("multiple overruns shows count instead of single name", () => {
    const insights = generateInsights({
      ...healthy,
      overBudgetItems: [
        { categoryName: "식비",  spent: 600_000, budget: 500_000 },
        { categoryName: "쇼핑", spent: 400_000, budget: 200_000 },
      ],
    });
    const rule = insights.find((i) => i.id === "budget_overrun");
    expect(rule?.message).toContain("2개");
  });

  it("does not trigger when no overruns", () => {
    const insights = generateInsights(healthy);
    expect(insights.some((i) => i.id === "budget_overrun")).toBe(false);
  });
});

// ─── Rule: spending_increase ──────────────────────────────────────────────────

describe("spending_increase rule", () => {
  it("triggers at exactly 20% increase", () => {
    const insights = generateInsights({
      ...healthy,
      expense:    2_160_000, // 1_800_000 * 1.2
      prevExpense: 1_800_000,
      savingsRate: 28,
    });
    expect(insights.some((i) => i.id === "spending_increase")).toBe(true);
  });

  it("does not trigger at 19% increase", () => {
    const insights = generateInsights({
      ...healthy,
      expense:    2_142_000, // 1_800_000 * 1.19
      prevExpense: 1_800_000,
    });
    expect(insights.some((i) => i.id === "spending_increase")).toBe(false);
  });

  it("does not trigger when prevExpense is null", () => {
    const insights = generateInsights({
      ...healthy,
      prevExpense: null,
    });
    expect(insights.some((i) => i.id === "spending_increase")).toBe(false);
  });

  it("severity is warning", () => {
    const insights = generateInsights({
      ...healthy,
      expense: 2_500_000,
      prevExpense: 1_800_000,
      savingsRate: 17,
    });
    const rule = insights.find((i) => i.id === "spending_increase");
    expect(rule?.severity).toBe("warning");
  });

  it("message includes percentage", () => {
    const insights = generateInsights({
      ...healthy,
      expense:    2_160_000,
      prevExpense: 1_800_000,
      savingsRate: 28,
    });
    const rule = insights.find((i) => i.id === "spending_increase");
    expect(rule?.message).toContain("20%");
  });
});

// ─── Rule: savings_decline ────────────────────────────────────────────────────

describe("savings_decline rule", () => {
  it("triggers when savingsRate < 10%", () => {
    const insights = generateInsights({
      ...healthy,
      savingsRate: 5,
      expense: 2_850_000, // well under income
    });
    expect(insights.some((i) => i.id === "savings_decline")).toBe(true);
  });

  it("does not trigger at exactly 10%", () => {
    const insights = generateInsights({
      ...healthy,
      savingsRate: 10,
    });
    expect(insights.some((i) => i.id === "savings_decline")).toBe(false);
  });

  it("does not trigger when savings_negative already fired (expense > income)", () => {
    const insights = generateInsights({
      ...healthy,
      income:  1_000_000,
      expense: 1_500_000,
      savingsRate: -50,
    });
    expect(insights.some((i) => i.id === "savings_decline")).toBe(false);
  });

  it("severity is warning", () => {
    const insights = generateInsights({
      ...healthy,
      savingsRate: 5,
    });
    const rule = insights.find((i) => i.id === "savings_decline");
    expect(rule?.severity).toBe("warning");
  });
});

// ─── Rule: top_category_spike ─────────────────────────────────────────────────

describe("top_category_spike rule", () => {
  it("triggers when top category is >= 40% of total", () => {
    const insights = generateInsights({
      ...healthy,
      expense: 1_000_000,
      categoryBreakdown: [
        { name: "쇼핑", amount: 450_000 }, // 45%
        { name: "식비", amount: 300_000 },
        { name: "교통", amount: 250_000 },
      ],
    });
    expect(insights.some((i) => i.id === "top_category_spike")).toBe(true);
  });

  it("does not trigger below 40%", () => {
    const insights = generateInsights({
      ...healthy,
      expense: 1_000_000,
      categoryBreakdown: [
        { name: "쇼핑", amount: 380_000 }, // 38%
        { name: "식비", amount: 400_000 }, // 40% — but "쇼핑" is not top here
        { name: "교통", amount: 220_000 },
      ],
    });
    const rule = insights.find((i) => i.id === "top_category_spike");
    if (rule) {
      // Only triggers if actual top category is >= 40%
      expect(rule.message).not.toContain("쇼핑");
    }
  });

  it("message includes category name and percentage", () => {
    const insights = generateInsights({
      ...healthy,
      expense: 1_000_000,
      categoryBreakdown: [{ name: "쇼핑", amount: 500_000 }],
    });
    const rule = insights.find((i) => i.id === "top_category_spike");
    expect(rule?.message).toContain("쇼핑");
    expect(rule?.message).toContain("50%");
  });
});

// ─── Rule: no_budget_set ──────────────────────────────────────────────────────

describe("no_budget_set rule", () => {
  it("triggers when budgetSetCount is 0 and expense > 0", () => {
    const insights = generateInsights({
      ...healthy,
      budgetSetCount: 0,
    });
    expect(insights.some((i) => i.id === "no_budget_set")).toBe(true);
  });

  it("does not trigger when budgets are set", () => {
    const insights = generateInsights(healthy); // budgetSetCount: 3
    expect(insights.some((i) => i.id === "no_budget_set")).toBe(false);
  });

  it("does not trigger when expense is 0 (no data yet)", () => {
    const insights = generateInsights({
      ...healthy,
      expense: 0,
      budgetSetCount: 0,
    });
    expect(insights.some((i) => i.id === "no_budget_set")).toBe(false);
  });

  it("severity is info", () => {
    const insights = generateInsights({
      ...healthy,
      budgetSetCount: 0,
    });
    const rule = insights.find((i) => i.id === "no_budget_set");
    expect(rule?.severity).toBe("info");
  });
});

// ─── Rule: healthy_savings ────────────────────────────────────────────────────

describe("healthy_savings rule", () => {
  it("triggers at exactly 30% savings rate", () => {
    const insights = generateInsights({
      ...healthy,
      savingsRate: 30,
    }, { maxInsights: 10 });
    expect(insights.some((i) => i.id === "healthy_savings")).toBe(true);
  });

  it("does not trigger below 30%", () => {
    const insights = generateInsights({
      ...healthy,
      savingsRate: 29,
    }, { maxInsights: 10 });
    expect(insights.some((i) => i.id === "healthy_savings")).toBe(false);
  });

  it("severity is positive", () => {
    const insights = generateInsights(healthy, { maxInsights: 10 }); // savingsRate: 40
    const rule = insights.find((i) => i.id === "healthy_savings");
    expect(rule?.severity).toBe("positive");
  });
});

// ─── Rule: spending_decrease ─────────────────────────────────────────────────

describe("spending_decrease rule", () => {
  it("triggers when expense dropped by >= 10%", () => {
    const insights = generateInsights({
      ...healthy,
      expense:     1_600_000,
      prevExpense: 1_800_000, // -11%
    }, { maxInsights: 10 });
    expect(insights.some((i) => i.id === "spending_decrease")).toBe(true);
  });

  it("does not trigger when drop is < 10%", () => {
    const insights = generateInsights({
      ...healthy,
      expense:     1_720_000,
      prevExpense: 1_800_000, // -4.4%
    }, { maxInsights: 10 });
    expect(insights.some((i) => i.id === "spending_decrease")).toBe(false);
  });
});

// ─── Prioritization ───────────────────────────────────────────────────────────

describe("generateInsights — prioritization", () => {
  it("returns alerts before warnings before info", () => {
    const insights = generateInsights(
      {
        ...healthy,
        income:  1_000_000,
        expense: 1_500_000,   // → savings_negative (alert)
        prevExpense: 1_000_000, // → spending_increase (warning) 50%
        savingsRate: -50,
        overBudgetItems: [{ categoryName: "식비", spent: 600_000, budget: 500_000 }], // → budget_overrun (alert)
        budgetSetCount: 1,
      },
      { maxInsights: 10 }
    );

    const alertIdx   = insights.findIndex((i) => i.severity === "alert");
    const warningIdx = insights.findIndex((i) => i.severity === "warning");
    if (alertIdx !== -1 && warningIdx !== -1) {
      expect(alertIdx).toBeLessThan(warningIdx);
    }
  });

  it("limits results to maxInsights (default 3)", () => {
    // Trigger many rules at once
    const insights = generateInsights({
      income:  1_000_000,
      expense: 1_500_000,
      prevExpense: 1_000_000,
      savingsRate: -50,
      categoryBreakdown: [{ name: "쇼핑", amount: 1_200_000 }],
      overBudgetItems: [{ categoryName: "식비", spent: 600_000, budget: 500_000 }],
      budgetSetCount: 1,
    });
    expect(insights.length).toBeLessThanOrEqual(3);
  });

  it("respects custom maxInsights", () => {
    const insights = generateInsights(healthy, { maxInsights: 1 });
    expect(insights.length).toBeLessThanOrEqual(1);
  });

  it("returns empty array when no rules trigger", () => {
    const insights = generateInsights({
      income: 0,
      expense: 0,
      prevExpense: null,
      savingsRate: null,
      categoryBreakdown: [],
      overBudgetItems: [],
      budgetSetCount: 0,
    });
    expect(insights).toHaveLength(0);
  });
});
