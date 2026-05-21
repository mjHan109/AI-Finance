import { z } from "zod";

// ─── Shared primitives ────────────────────────────────────────────────────────

export const uuidSchema = z
  .string()
  .regex(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i, "올바르지 않은 ID 형식입니다.");

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const signupSchema = z.object({
  name:     z.string().trim().min(1, "이름을 입력해주세요.").max(50),
  email:    z.string().email("올바른 이메일 형식을 입력해주세요.").max(254),
  password: z.string().min(8, "비밀번호는 8자 이상이어야 합니다.").max(128),
});

// ─── Budget ───────────────────────────────────────────────────────────────────

export const budgetUpsertSchema = z.object({
  categoryId: uuidSchema,
  year:       z.number().int().min(2000).max(2100),
  month:      z.number().int().min(1).max(12),
  amount:     z.number().nonnegative("금액은 0 이상이어야 합니다.").finite(),
});

// ─── Transaction ──────────────────────────────────────────────────────────────

export const txPatchSchema = z
  .object({
    memo:       z.string().max(200).nullable().optional(),
    isExcluded: z.boolean().optional(),
    categoryId: uuidSchema.nullable().optional(),
  })
  .strict();

// ─── Goal ─────────────────────────────────────────────────────────────────────

export const goalCreateSchema = z.object({
  name:         z.string().trim().min(1, "목표 이름을 입력해주세요.").max(50),
  icon:         z.string().max(10).optional(),
  targetAmount: z.number().positive("목표 금액은 0보다 커야 합니다.").finite(),
  targetDate:   z.string().nullish(),
});

export const goalPatchSchema = z.object({
  name:         z.string().trim().min(1).max(50).optional(),
  icon:         z.string().max(10).optional(),
  targetAmount: z.number().positive().finite().optional(),
  savedAmount:  z.number().nonnegative().optional(),
  targetDate:   z.string().nullish(),
  isCompleted:  z.boolean().optional(),
});

// ─── Account ──────────────────────────────────────────────────────────────────

export const accountCreateSchema = z.object({
  name:  z.string().trim().min(1, "계좌 이름을 입력해주세요.").max(50),
  type:  z.enum(["BANK", "CARD", "CASH"], { message: "올바르지 않은 계좌 종류입니다." }),
  color: z.string().max(20).nullable().optional(),
});

// ─── AI Insights ──────────────────────────────────────────────────────────────

export const insightsQuerySchema = z.object({
  year:  z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
});

// ─── Helper ───────────────────────────────────────────────────────────────────

/** Parses a Zod schema and returns { data } or { error, status }. */
export function safeParse<T>(
  schema: z.ZodType<T>,
  input: unknown,
): { ok: true; data: T } | { ok: false; error: string } {
  const result = schema.safeParse(input);
  if (result.success) return { ok: true, data: result.data };
  const msg = result.error.issues[0]?.message ?? "입력값이 올바르지 않습니다.";
  return { ok: false, error: msg };
}
