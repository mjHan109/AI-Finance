import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyTransaction, buildCorrectionMap } from "@/modules/categories/classify";
import { log } from "@/lib/logger";

const RECLASSIFY_COOLDOWN_MS = 60 * 1000;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    // 60s cooldown via DB
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { lastReclassifyAt: true },
    });
    if (user?.lastReclassifyAt) {
      const elapsed = Date.now() - user.lastReclassifyAt.getTime();
      if (elapsed < RECLASSIFY_COOLDOWN_MS) {
        const waitSec = Math.ceil((RECLASSIFY_COOLDOWN_MS - elapsed) / 1000);
        return NextResponse.json({ error: `${waitSec}초 후 다시 시도해주세요.` }, { status: 429 });
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { lastReclassifyAt: new Date() },
    });

    const [transactions, categories, corrections] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId, isIncome: false, classifiedBy: { not: "USER" } },
        select: { id: true, description: true, aiCategory: true },
      }),
      prisma.category.findMany({ select: { id: true, name: true } }),
      prisma.userCorrection.findMany({
        where: { userId },
        select: { pattern: true, categoryId: true },
      }),
    ]);

    const catMap: Record<string, string> = {};
    for (const c of categories) catMap[c.name] = c.id;

    const correctionMap = buildCorrectionMap(corrections);

    // Classify each transaction using the unified pipeline with normalization
    const grouped: Record<string, string[]> = {};

    for (const tx of transactions) {
      const result = classifyTransaction({
        description:   tx.description,
        aiCategory:    tx.aiCategory,
        correctionMap,
        catMap,
      });

      const key = result.categoryId ?? "__null__";
      if (!grouped[key]) grouped[key] = [];
      grouped[key].push(tx.id);
    }

    // Batch updateMany grouped by category (O(K) DB ops, K = distinct categories)
    await prisma.$transaction(
      Object.entries(grouped).map(([key, ids]) =>
        prisma.transaction.updateMany({
          where: { id: { in: ids }, userId },
          data: {
            categoryId:   key === "__null__" ? null : key,
            classifiedBy: "RULE",
          },
        }),
      ),
    );

    log("info", "reclassify", { userId, updated: transactions.length, corrections: corrections.length });
    return NextResponse.json({ updated: transactions.length });
  } catch {
    log("error", "server_error", { route: "POST /api/reclassify" });
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
