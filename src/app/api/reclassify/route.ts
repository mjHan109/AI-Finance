import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyByKeywords, mapBanksaladCategory } from "@/modules/categories/rules";

const RECLASSIFY_COOLDOWN_MS = 60 * 1000; // 60초

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  // Rate limit: lastReclassifyAt 기준 60초 쿨다운
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { lastReclassifyAt: true },
  });
  if (user?.lastReclassifyAt) {
    const elapsed = Date.now() - user.lastReclassifyAt.getTime();
    if (elapsed < RECLASSIFY_COOLDOWN_MS) {
      const waitSec = Math.ceil((RECLASSIFY_COOLDOWN_MS - elapsed) / 1000);
      return NextResponse.json(
        { error: `${waitSec}초 후 다시 시도해주세요.` },
        { status: 429 }
      );
    }
  }

  // lastReclassifyAt 갱신
  await prisma.user.update({
    where: { id: userId },
    data: { lastReclassifyAt: new Date() },
  });

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, isIncome: false, classifiedBy: { not: "USER" } },
      select: { id: true, description: true, aiCategory: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const catMap: Record<string, string> = {};
  for (const c of categories as Array<{ id: string; name: string }>) catMap[c.name] = c.id;
  let updated = 0;

  for (const tx of transactions) {
    let categoryId: string | null = null;
    if (tx.aiCategory) {
      const mapped = mapBanksaladCategory(tx.aiCategory);
      if (mapped) categoryId = catMap[mapped] ?? null;
    }
    if (!categoryId) {
      const rule = classifyByKeywords(tx.description);
      categoryId = catMap[rule.name] ?? catMap["기타"] ?? null;
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { categoryId, classifiedBy: "RULE" },
    });
    updated++;
  }

  return NextResponse.json({ updated });
}
