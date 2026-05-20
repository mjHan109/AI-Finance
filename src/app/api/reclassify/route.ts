import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { classifyByKeywords, mapBanksaladCategory } from "@/modules/categories/rules";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { userId, isIncome: false },
      select: { id: true, description: true, aiCategory: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const catMap = new Map(categories.map((c) => [c.name, c.id]));
  let updated = 0;

  for (const tx of transactions) {
    // 뱅크샐러드 aiCategory 힌트가 있으면 우선 사용
    let categoryId: string | null = null;
    if (tx.aiCategory) {
      const mapped = mapBanksaladCategory(tx.aiCategory);
      if (mapped) categoryId = catMap.get(mapped) ?? null;
    }
    if (!categoryId) {
      const rule = classifyByKeywords(tx.description);
      categoryId = catMap.get(rule.name) ?? catMap.get("기타") ?? null;
    }

    await prisma.transaction.update({
      where: { id: tx.id },
      data: { categoryId, classifiedBy: "RULE" },
    });
    updated++;
  }

  return NextResponse.json({ updated });
}
