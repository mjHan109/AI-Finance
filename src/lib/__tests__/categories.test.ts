import { describe, it, expect } from "vitest";
import { mapBanksaladCategory, CATEGORY_RULES } from "../../modules/categories/rules";

describe("BankSalad category mapping", () => {
  it("저축 → 저축/적금 (SAVINGS)", () => {
    const name = mapBanksaladCategory("저축");
    const rule = CATEGORY_RULES.find(r => r.name === name);
    expect(name).toBe("저축/적금");
    expect(rule?.flowType).toBe("SAVINGS");
  });

  it("적금 → 저축/적금 (SAVINGS)", () => {
    const name = mapBanksaladCategory("적금");
    expect(name).toBe("저축/적금");
  });

  it("저축/적금 → 저축/적금 (SAVINGS)", () => {
    const name = mapBanksaladCategory("저축/적금");
    expect(name).toBe("저축/적금");
  });

  it("예금 → 저축/적금 (SAVINGS)", () => {
    const name = mapBanksaladCategory("예금");
    expect(name).toBe("저축/적금");
  });

  it("투자 → 투자 (INVESTMENT)", () => {
    const name = mapBanksaladCategory("투자");
    const rule = CATEGORY_RULES.find(r => r.name === name);
    expect(name).toBe("투자");
    expect(rule?.flowType).toBe("INVESTMENT");
  });

  it("금융 → 금융/이체 (TRANSFER)", () => {
    const name = mapBanksaladCategory("금융");
    const rule = CATEGORY_RULES.find(r => r.name === name);
    expect(name).toBe("금융/이체");
    expect(rule?.flowType).toBe("TRANSFER");
  });

  it("이체 → 금융/이체 (TRANSFER)", () => {
    const name = mapBanksaladCategory("이체");
    expect(name).toBe("금융/이체");
  });

  it("보험 → 금융/이체 (TRANSFER)", () => {
    const name = mapBanksaladCategory("보험");
    expect(name).toBe("금융/이체");
  });

  it("식비 → 식비 (CONSUMPTION)", () => {
    const name = mapBanksaladCategory("식비");
    const rule = CATEGORY_RULES.find(r => r.name === name);
    expect(name).toBe("식비");
    expect(rule?.flowType).toBe("CONSUMPTION");
  });

  it("unknown category returns null", () => {
    expect(mapBanksaladCategory("존재하지않는카테고리")).toBeNull();
  });

  it("empty string returns null", () => {
    expect(mapBanksaladCategory("")).toBeNull();
  });
});

describe("Category flowType invariants", () => {
  it("every category has a valid flowType", () => {
    const valid = ["CONSUMPTION", "SAVINGS", "INVESTMENT", "TRANSFER"];
    for (const r of CATEGORY_RULES) {
      expect(valid).toContain(r.flowType);
    }
  });

  it("카드대금/이체 categories are TRANSFER, not CONSUMPTION", () => {
    const transfer = CATEGORY_RULES.filter(r => r.flowType === "TRANSFER");
    expect(transfer.length).toBeGreaterThanOrEqual(1);
    // 금융/이체 must be TRANSFER
    const finance = CATEGORY_RULES.find(r => r.name === "금융/이체");
    expect(finance?.flowType).toBe("TRANSFER");
  });

  it("저축/적금 is SAVINGS, not CONSUMPTION", () => {
    const savings = CATEGORY_RULES.find(r => r.name === "저축/적금");
    expect(savings?.flowType).toBe("SAVINGS");
  });

  it("투자 is INVESTMENT, not CONSUMPTION", () => {
    const investment = CATEGORY_RULES.find(r => r.name === "투자");
    expect(investment?.flowType).toBe("INVESTMENT");
  });
});
