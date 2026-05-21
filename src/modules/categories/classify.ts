/**
 * Unified transaction classification pipeline.
 *
 * Priority order:
 *   1. User correction (normalized merchant match)
 *   2. User correction (raw description match — backward compat)
 *   3. AI / Banksalad category mapping
 *   4. Keyword rule matching
 *   5. "기타" fallback
 */

import { normalizeMerchant } from "./normalize";
import { classifyByKeywords, mapBanksaladCategory } from "./rules";

export type ClassifySource =
  | "user_correction"
  | "ai_mapping"
  | "keyword_rule"
  | "fallback";

export interface ClassifyResult {
  categoryId: string | null;
  source: ClassifySource;
  /** Normalized merchant name used for correction lookup */
  normalizedDescription: string;
}

export interface ClassifyInput {
  description: string;
  aiCategory?: string | null;
  /** Map of normalized-lowercase pattern → categoryId */
  correctionMap: Record<string, string>;
  /** Map of category name → categoryId */
  catMap: Record<string, string>;
}

/**
 * Build a correction lookup map from DB records.
 * Keys are expected to be already-normalized lowercase patterns.
 */
export function buildCorrectionMap(
  corrections: { pattern: string; categoryId: string }[]
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const c of corrections) {
    map[c.pattern] = c.categoryId;
  }
  return map;
}

export function classifyTransaction(input: ClassifyInput): ClassifyResult {
  const { description, aiCategory, correctionMap, catMap } = input;

  const normalized = normalizeMerchant(description);
  const normalizedLower = normalized.toLowerCase();
  const rawLower = description.toLowerCase();

  // 1. User correction — normalized lookup (new corrections)
  const byNormalized = correctionMap[normalizedLower];
  if (byNormalized) {
    return {
      categoryId: byNormalized,
      source: "user_correction",
      normalizedDescription: normalized,
    };
  }

  // 2. User correction — raw lookup (backward compat for existing corrections)
  if (rawLower !== normalizedLower) {
    const byRaw = correctionMap[rawLower];
    if (byRaw) {
      return {
        categoryId: byRaw,
        source: "user_correction",
        normalizedDescription: normalized,
      };
    }
  }

  // 3. AI / Banksalad category mapping
  if (aiCategory) {
    const mapped = mapBanksaladCategory(aiCategory);
    if (mapped) {
      const categoryId = catMap[mapped] ?? null;
      if (categoryId) {
        return {
          categoryId,
          source: "ai_mapping",
          normalizedDescription: normalized,
        };
      }
    }
  }

  // 4. Keyword rule
  const rule = classifyByKeywords(description);
  const isDefault = rule.keywords.length === 0; // "기타" has empty keywords

  return {
    categoryId: catMap[rule.name] ?? catMap["기타"] ?? null,
    source: isDefault ? "fallback" : "keyword_rule",
    normalizedDescription: normalized,
  };
}
