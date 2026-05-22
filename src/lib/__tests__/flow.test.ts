import { describe, it, expect } from "vitest";
import { computeFlowSummary } from "../flow";

describe("computeFlowSummary", () => {
  it("salary income only — zero expense rows returns null savingsRate", () => {
    const result = computeFlowSummary(3_000_000, []);
    expect(result.income).toBe(3_000_000);
    expect(result.consumption).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.investment).toBe(0);
    expect(result.transfer).toBe(0);
    expect(result.savingsRate).toBe(0);
  });

  it("food spending only — counted as consumption, savingsRate is 0", () => {
    const result = computeFlowSummary(3_000_000, [
      { amount: 500_000, flowType: "CONSUMPTION" },
    ]);
    expect(result.consumption).toBe(500_000);
    expect(result.savings).toBe(0);
    expect(result.savingsRate).toBe(0);
  });

  it("card payment (TRANSFER) — excluded from consumption and savings", () => {
    const result = computeFlowSummary(3_000_000, [
      { amount: 800_000, flowType: "TRANSFER" },
      { amount: 200_000, flowType: "CONSUMPTION" },
    ]);
    expect(result.consumption).toBe(200_000);
    expect(result.transfer).toBe(800_000);
    expect(result.savings).toBe(0);
    expect(result.savingsRate).toBe(0);
  });

  it("installment savings (SAVINGS) — counted in savings, increases savingsRate", () => {
    const result = computeFlowSummary(2_000_000, [
      { amount: 300_000, flowType: "SAVINGS" },
      { amount: 500_000, flowType: "CONSUMPTION" },
    ]);
    expect(result.savings).toBe(300_000);
    expect(result.consumption).toBe(500_000);
    // savingsRate = round((300_000 / 2_000_000) * 100) = 15
    expect(result.savingsRate).toBe(15);
  });

  it("investment deposit (INVESTMENT) — counted in investment, increases savingsRate", () => {
    const result = computeFlowSummary(2_000_000, [
      { amount: 400_000, flowType: "INVESTMENT" },
    ]);
    expect(result.investment).toBe(400_000);
    expect(result.consumption).toBe(0);
    // savingsRate = round((400_000 / 2_000_000) * 100) = 20
    expect(result.savingsRate).toBe(20);
  });

  it("internal transfer (TRANSFER) — excluded entirely from all metrics", () => {
    const result = computeFlowSummary(3_000_000, [
      { amount: 1_000_000, flowType: "TRANSFER" },
    ]);
    expect(result.transfer).toBe(1_000_000);
    expect(result.consumption).toBe(0);
    expect(result.savings).toBe(0);
    expect(result.investment).toBe(0);
    expect(result.savingsRate).toBe(0);
  });

  it("null flowType defaults to CONSUMPTION", () => {
    const result = computeFlowSummary(1_000_000, [
      { amount: 100_000, flowType: null },
    ]);
    expect(result.consumption).toBe(100_000);
    expect(result.savings).toBe(0);
  });

  it("mixed scenario — all flow types combined", () => {
    // income: 4,000,000
    // food: 600,000 CONSUMPTION
    // card payment: 500,000 TRANSFER
    // savings: 400,000 SAVINGS
    // investment: 200,000 INVESTMENT
    const result = computeFlowSummary(4_000_000, [
      { amount: 600_000, flowType: "CONSUMPTION" },
      { amount: 500_000, flowType: "TRANSFER" },
      { amount: 400_000, flowType: "SAVINGS" },
      { amount: 200_000, flowType: "INVESTMENT" },
    ]);
    expect(result.consumption).toBe(600_000);
    expect(result.transfer).toBe(500_000);
    expect(result.savings).toBe(400_000);
    expect(result.investment).toBe(200_000);
    // savingsRate = round(((400_000 + 200_000) / 4_000_000) * 100) = 15
    expect(result.savingsRate).toBe(15);
  });

  it("zero income — savingsRate is null", () => {
    const result = computeFlowSummary(0, [
      { amount: 100_000, flowType: "CONSUMPTION" },
    ]);
    expect(result.savingsRate).toBe(null);
  });

  it("savings+investment exceeds income — savingsRate can exceed 100", () => {
    const result = computeFlowSummary(1_000_000, [
      { amount: 600_000, flowType: "SAVINGS" },
      { amount: 600_000, flowType: "INVESTMENT" },
    ]);
    expect(result.savingsRate).toBe(120);
  });
});
