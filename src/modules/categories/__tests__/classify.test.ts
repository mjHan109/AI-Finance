import { describe, it, expect } from "vitest";
import { classifyTransaction, buildCorrectionMap } from "../classify";

// Minimal category map for tests
const catMap = {
  "카페/간식": "cat-cafe",
  "식비":      "cat-food",
  "교통":      "cat-transport",
  "금융/이체": "cat-finance",
  "기타":      "cat-other",
};

describe("classifyTransaction", () => {
  // ─── User correction (normalized) ────────────────────────────────────────
  describe("user_correction source", () => {
    it("matches exact normalized form", () => {
      const correctionMap = buildCorrectionMap([
        { pattern: "스타벅스", categoryId: "cat-cafe" },
      ]);
      const result = classifyTransaction({
        description: "스타벅스",
        correctionMap,
        catMap,
      });
      expect(result.source).toBe("user_correction");
      expect(result.categoryId).toBe("cat-cafe");
    });

    it("matches via normalization — branch suffix stripped before lookup", () => {
      // Correction saved for "스타벅스", transaction has "스타벅스 강남역점"
      const correctionMap = buildCorrectionMap([
        { pattern: "스타벅스", categoryId: "cat-other" }, // user overrode to 기타
      ]);
      const result = classifyTransaction({
        description: "스타벅스 강남역점",
        correctionMap,
        catMap,
      });
      expect(result.source).toBe("user_correction");
      expect(result.categoryId).toBe("cat-other");
    });

    it("matches variant with reserve suffix", () => {
      const correctionMap = buildCorrectionMap([
        { pattern: "스타벅스", categoryId: "cat-cafe" },
      ]);
      const result = classifyTransaction({
        description: "스타벅스 리저브",
        correctionMap,
        catMap,
      });
      expect(result.source).toBe("user_correction");
    });

    it("matches STARBUCKS #123 variant", () => {
      const correctionMap = buildCorrectionMap([
        { pattern: "starbucks", categoryId: "cat-cafe" },
      ]);
      const result = classifyTransaction({
        description: "STARBUCKS #123",
        correctionMap,
        catMap,
      });
      expect(result.source).toBe("user_correction");
    });

    it("USER correction takes priority over keyword rules", () => {
      // Keyword rule would classify "스타벅스" as 카페/간식
      // User correction overrides to 기타
      const correctionMap = buildCorrectionMap([
        { pattern: "스타벅스", categoryId: "cat-other" },
      ]);
      const result = classifyTransaction({
        description: "스타벅스 강남점",
        correctionMap,
        catMap,
      });
      expect(result.categoryId).toBe("cat-other");
      expect(result.source).toBe("user_correction");
    });
  });

  // ─── Backward compat: raw description lookup ─────────────────────────────
  describe("backward compat — raw pattern lookup", () => {
    it("falls back to raw description pattern for old corrections", () => {
      // Old correction stored raw (not normalized)
      const correctionMap = buildCorrectionMap([
        { pattern: "스타벅스 강남역점", categoryId: "cat-other" },
      ]);
      const result = classifyTransaction({
        description: "스타벅스 강남역점",
        correctionMap,
        catMap,
      });
      expect(result.source).toBe("user_correction");
      expect(result.categoryId).toBe("cat-other");
    });
  });

  // ─── AI mapping source ───────────────────────────────────────────────────
  describe("ai_mapping source", () => {
    it("uses Banksalad AI category when no correction exists", () => {
      const result = classifyTransaction({
        description: "SomeUnknownPlace",
        aiCategory:  "카페/간식",
        correctionMap: {},
        catMap,
      });
      expect(result.source).toBe("ai_mapping");
      expect(result.categoryId).toBe("cat-cafe");
    });

    it("maps Banksalad alias 마트/편의점 → 생활/마트", () => {
      const catMapExtended = { ...catMap, "생활/마트": "cat-mart" };
      const result = classifyTransaction({
        description: "이상한상점",
        aiCategory:  "마트/편의점",
        correctionMap: {},
        catMap: catMapExtended,
      });
      expect(result.source).toBe("ai_mapping");
      expect(result.categoryId).toBe("cat-mart");
    });

    it("AI category is skipped if category not in catMap", () => {
      // "문화/여가" not in our small catMap
      const result = classifyTransaction({
        description: "이상한곳",
        aiCategory:  "문화/여가",
        correctionMap: {},
        catMap, // no "문화/여가" key
      });
      // Falls through to keyword or fallback
      expect(["keyword_rule", "fallback"]).toContain(result.source);
    });
  });

  // ─── Keyword rule source ─────────────────────────────────────────────────
  describe("keyword_rule source", () => {
    it("classifies 스타벅스 as 카페/간식 via keyword", () => {
      const result = classifyTransaction({
        description: "스타벅스",
        correctionMap: {},
        catMap,
      });
      expect(result.source).toBe("keyword_rule");
      expect(result.categoryId).toBe("cat-cafe");
    });

    it("classifies 배달의민족 as 식비 via keyword", () => {
      const result = classifyTransaction({
        description: "배달의민족",
        correctionMap: {},
        catMap,
      });
      expect(result.source).toBe("keyword_rule");
      expect(result.categoryId).toBe("cat-food");
    });

    it("classifies 지하철 as 교통", () => {
      const result = classifyTransaction({
        description: "지하철 교통카드",
        correctionMap: {},
        catMap,
      });
      expect(result.source).toBe("keyword_rule");
      expect(result.categoryId).toBe("cat-transport");
    });
  });

  // ─── Fallback ────────────────────────────────────────────────────────────
  describe("fallback source", () => {
    it("falls back to 기타 for unrecognized merchant", () => {
      const result = classifyTransaction({
        description: "완전히모르는상호xyz",
        correctionMap: {},
        catMap,
      });
      expect(result.source).toBe("fallback");
      expect(result.categoryId).toBe("cat-other");
    });

    it("returns null categoryId if 기타 not in catMap", () => {
      const { "기타": _removed, ...catMapWithout기타 } = catMap;
      const result = classifyTransaction({
        description: "완전히모르는상호xyz",
        correctionMap: {},
        catMap: catMapWithout기타,
      });
      expect(result.source).toBe("fallback");
      expect(result.categoryId).toBeNull();
    });
  });

  // ─── normalizedDescription ───────────────────────────────────────────────
  describe("normalizedDescription output", () => {
    it("returns normalized form in result", () => {
      const result = classifyTransaction({
        description: "스타벅스 강남역점",
        correctionMap: {},
        catMap,
      });
      expect(result.normalizedDescription).toBe("스타벅스");
    });

    it("returns unchanged description when nothing to strip", () => {
      const result = classifyTransaction({
        description: "스타벅스",
        correctionMap: {},
        catMap,
      });
      expect(result.normalizedDescription).toBe("스타벅스");
    });
  });
});

describe("buildCorrectionMap", () => {
  it("builds map from corrections array", () => {
    const map = buildCorrectionMap([
      { pattern: "스타벅스",  categoryId: "cat-cafe"  },
      { pattern: "배달의민족", categoryId: "cat-food" },
    ]);
    expect(map["스타벅스"]).toBe("cat-cafe");
    expect(map["배달의민족"]).toBe("cat-food");
  });

  it("later duplicate key overwrites earlier", () => {
    const map = buildCorrectionMap([
      { pattern: "스타벅스", categoryId: "cat-cafe"  },
      { pattern: "스타벅스", categoryId: "cat-other" },
    ]);
    expect(map["스타벅스"]).toBe("cat-other");
  });

  it("returns empty map for empty input", () => {
    expect(buildCorrectionMap([])).toEqual({});
  });
});
