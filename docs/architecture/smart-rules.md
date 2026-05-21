# Smart Rules Architecture

Status: Proposed
Target: Phase 5-A

---

## Current State

The existing categorization pipeline (`src/modules/categories/rules.ts`) is:

```
User Correction (UserCorrection table)
  → AI Category mapping (mapBanksaladCategory)
    → Keyword rule matching (classifyByKeywords)
      → "기타" fallback
```

This works but has two weaknesses:
1. **No merchant normalization** — "스타벅스 강남역점", "STARBUCKS KOREA" both treated as different strings
2. **User corrections store raw description** — corrections don't generalize across branches

---

## Proposed Addition: Merchant Normalization Layer

Insert a normalization step BEFORE keyword matching. Pure string transformation — no DB changes needed.

### Normalization Rules (in priority order)

```typescript
// src/modules/categories/normalize.ts

const STRIP_PATTERNS = [
  // Branch/location suffixes (Korean)
  /\s*(강남|홍대|신촌|합정|이태원|잠실|종로|명동|여의도|판교|수원|부산|대구|인천)\s*(점|역점|지점)?$/,
  /\s*(점|지점|매장|센터|플라자|타워|몰|마트)\s*\d*$/,
  // Numberic suffixes
  /\s*\d{1,4}호점$/,
  /\s*#\d+$/,
  // Online/app suffixes
  /\s*(온라인|앱|APP|WEB|web|모바일)$/i,
  // Common business entity suffixes
  /\s*(주식회사|㈜|\(주\))\s*/g,
  /\s*(co\.,?\s*ltd\.?|inc\.?|corp\.?)$/i,
  // Card payment artifacts
  /^(신한카드|국민카드|하나카드|우리카드|삼성카드|롯데카드)\s*/,
];

export function normalizeMerchant(raw: string): string {
  let s = raw.trim();
  for (const pattern of STRIP_PATTERNS) {
    s = s.replace(pattern, "").trim();
  }
  return s || raw; // Never return empty string
}
```

### Updated Classification Pipeline

```
raw description
  → normalizeMerchant()            ← NEW
    → User Correction lookup (normalized key)
      → AI Category mapping
        → Keyword rule matching
          → "기타" fallback
```

### Schema Change — None Required

`UserCorrection.pattern` already stores lowercased description. After normalization is applied consistently, existing corrections continue to work. New corrections will store normalized form.

---

## Proposed Addition: Rule Confidence Tracking

Add optional `confidence` to `classifyByKeywords` return — useful for future AI triage.

```typescript
export interface ClassifyResult {
  category: CategoryRule;
  matchedKeyword: string | null;  // Which keyword triggered the match
  confidence: "high" | "low";     // high = exact merchant match, low = generic keyword
}
```

This requires no schema changes. `matchedKeyword` enables better user-facing explanations ("분류 근거: 스타벅스 → 카페/간식").

---

## Schema Change Proposal (Minimal)

Only one optional addition:

```prisma
model UserCorrection {
  id          String   @id @default(cuid())
  userId      String
  pattern     String   // normalized, lowercased merchant name
  categoryId  String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // NEW — optional, for display in UI
  displayName String?  // Original raw description before normalization

  user        User     @relation(...)
  category    Category @relation(...)

  @@unique([userId, pattern])
}
```

**Migration impact:** Non-breaking. `displayName` is optional. Existing rows are unaffected.

---

## What NOT to Build Yet

- ML-based merchant clustering (overkill for current dataset size)
- External merchant database lookup (API cost, latency)
- Per-user rule learning from correction frequency (Phase 5-B)
- Background rule re-evaluation worker (constraint: no queues)
