import { describe, it, expect } from "vitest";
import { normalizeMerchant } from "../normalize";

describe("normalizeMerchant", () => {
  // ─── Korean branch suffixes ──────────────────────────────────────────────
  describe("Korean branch suffix stripping", () => {
    it("strips 점 suffix", () => {
      expect(normalizeMerchant("스타벅스 강남점")).toBe("스타벅스");
      expect(normalizeMerchant("투썸플레이스 홍대점")).toBe("투썸플레이스");
      expect(normalizeMerchant("이마트 수원점")).toBe("이마트");
    });

    it("strips 역점 suffix", () => {
      expect(normalizeMerchant("스타벅스 강남역점")).toBe("스타벅스");
      expect(normalizeMerchant("맥도날드 홍대역점")).toBe("맥도날드");
    });

    it("strips 지점 suffix", () => {
      expect(normalizeMerchant("하나은행 강남지점")).toBe("하나은행");
    });

    it("strips 매장 suffix", () => {
      expect(normalizeMerchant("나이키 강남매장")).toBe("나이키");
    });

    it("strips 센터 suffix", () => {
      expect(normalizeMerchant("삼성전자 서비스 강남센터")).toBe("삼성전자 서비스");
    });

    it("strips 호점 suffix", () => {
      expect(normalizeMerchant("맥도날드 1호점")).toBe("맥도날드");
      expect(normalizeMerchant("피자헛 12호점")).toBe("피자헛");
    });
  });

  // ─── English numeric suffixes ────────────────────────────────────────────
  describe("English numeric suffix stripping", () => {
    it("strips # number", () => {
      expect(normalizeMerchant("STARBUCKS #123")).toBe("STARBUCKS");
      expect(normalizeMerchant("STARBUCKS #4567")).toBe("STARBUCKS");
    });

    it("strips parenthesized number", () => {
      expect(normalizeMerchant("STARBUCKS (123)")).toBe("STARBUCKS");
    });
  });

  // ─── Sub-brand suffixes ──────────────────────────────────────────────────
  describe("sub-brand suffix stripping", () => {
    it("strips 리저브", () => {
      expect(normalizeMerchant("스타벅스 리저브")).toBe("스타벅스");
    });

    it("strips reserve (English)", () => {
      expect(normalizeMerchant("STARBUCKS RESERVE")).toBe("STARBUCKS");
    });

    it("strips 프리미엄 / premium", () => {
      expect(normalizeMerchant("버거킹 프리미엄")).toBe("버거킹");
    });

    it("strips 시그니처 / signature", () => {
      expect(normalizeMerchant("맥도날드 시그니처")).toBe("맥도날드");
    });
  });

  // ─── Corporate suffixes ──────────────────────────────────────────────────
  describe("corporate suffix stripping", () => {
    it("strips leading (주)", () => {
      expect(normalizeMerchant("(주)신한은행")).toBe("신한은행");
    });

    it("strips trailing (주)", () => {
      expect(normalizeMerchant("신한은행(주)")).toBe("신한은행");
    });

    it("strips ㈜", () => {
      expect(normalizeMerchant("㈜신한은행")).toBe("신한은행");
    });

    it("strips leading 주식회사", () => {
      expect(normalizeMerchant("주식회사 ABC")).toBe("ABC");
    });
  });

  // ─── Online/mobile suffixes ──────────────────────────────────────────────
  describe("online/mobile suffix stripping", () => {
    it("strips 온라인", () => {
      expect(normalizeMerchant("쿠팡 온라인")).toBe("쿠팡");
    });

    it("strips 앱결제", () => {
      expect(normalizeMerchant("네이버페이 앱결제")).toBe("네이버페이");
    });
  });

  // ─── Chained stripping ───────────────────────────────────────────────────
  describe("chained normalization", () => {
    it("handles multiple suffixes in sequence", () => {
      // "(주)스타벅스 강남역점" → "스타벅스"
      expect(normalizeMerchant("(주)스타벅스 강남역점")).toBe("스타벅스");
    });
  });

  // ─── Preservation / no false positives ──────────────────────────────────
  describe("preservation — should not strip", () => {
    it("preserves merchant without branch", () => {
      expect(normalizeMerchant("스타벅스")).toBe("스타벅스");
      expect(normalizeMerchant("이마트")).toBe("이마트");
      expect(normalizeMerchant("STARBUCKS")).toBe("STARBUCKS");
    });

    it("preserves alphanumeric brand names", () => {
      expect(normalizeMerchant("GS25")).toBe("GS25");
      expect(normalizeMerchant("7-ELEVEN")).toBe("7-ELEVEN");
    });

    it("preserves brand names with numbers that are part of the name", () => {
      expect(normalizeMerchant("31아이스크림")).toBe("31아이스크림");
    });

    it("never returns empty string", () => {
      // Even if stripping would make it empty, returns original
      expect(normalizeMerchant("점")).toBe("점");
    });

    it("handles empty/whitespace input gracefully", () => {
      expect(normalizeMerchant("")).toBe("");
      expect(normalizeMerchant("  ").trim()).toBe("");
    });
  });
});
