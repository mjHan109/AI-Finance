/**
 * Merchant Normalization
 *
 * Strips branch names, numeric suffixes, and corporate markers from
 * raw bank transaction descriptions so that corrections generalize
 * across store variants.
 *
 * Examples:
 *   "스타벅스 강남역점"  → "스타벅스"
 *   "스타벅스 리저브"    → "스타벅스"
 *   "STARBUCKS #123"     → "STARBUCKS"
 *   "투썸플레이스 홍대점" → "투썸플레이스"
 *   "(주)신한은행"        → "신한은행"
 */

// Applied in order — each strips one class of suffix/prefix.
// All patterns are anchored or only match known safe forms.
const STRIP_STEPS: ((s: string) => string)[] = [
  // 1. Card issuer prefix injected by KB/NH bank exports
  (s) =>
    s.replace(
      /^(신한카드|국민카드|하나카드|우리카드|삼성카드|롯데카드|현대카드|농협카드|씨티카드|비씨카드)\s+/i,
      ""
    ),

  // 2. Corporate entity markers: (주), ㈜, 주식회사, 유한회사
  (s) => s.replace(/^[(（]주[)）]\s*/g, ""),
  (s) => s.replace(/\s*[(（]주[)）]\s*$/g, ""),
  (s) => s.replace(/\s*㈜\s*/g, " "),
  (s) => s.replace(/^(주식회사|유한회사)\s+/, ""),
  (s) => s.replace(/\s+(주식회사|유한회사)\s*$/, ""),
  (s) => s.replace(/\s+(co\.?,?\s*ltd\.?|inc\.?|corp\.?)\s*$/i, ""),

  // 3. English numeric branch identifiers: #123, (123)
  (s) => s.replace(/\s*[#＃]\s*\d+\s*$/, ""),
  (s) => s.replace(/\s*\(\s*\d+\s*\)\s*$/, ""),

  // 4. Korean branch/location suffixes
  //    Matches: "강남점", "강남역점", "수원지점", "판교매장", "강남센터"
  //    Requires a 점|지점|매장|센터|플라자 marker — won't strip bare place names
  (s) =>
    s.replace(
      /\s+[가-힣]{1,5}역?\s*(점|지점|매장|센터|플라자)\s*\d*\s*$/,
      ""
    ),

  // 5. 호점: "1호점", "12호점"
  (s) => s.replace(/\s*\d+호점\s*$/, ""),

  // 6. Sub-brand suffixes: "리저브", "reserve", "프리미엄", "시그니처"
  (s) =>
    s.replace(
      /\s+(리저브|reserve|premium|프리미엄|signature|시그니처|deluxe)\s*$/i,
      ""
    ),

  // 7. Online/mobile payment markers
  (s) => s.replace(/\s*(온라인|앱결제|모바일결제)\s*$/, ""),

  // 8. Collapse multiple spaces
  (s) => s.replace(/\s{2,}/g, " "),
];

export function normalizeMerchant(raw: string): string {
  if (!raw) return raw;

  let s = raw.trim();

  for (const step of STRIP_STEPS) {
    const result = step(s).trim();
    // Never produce an empty string — stop applying if that would happen
    if (result.length > 0) {
      s = result;
    }
  }

  return s;
}
