import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeFlowSummary } from "@/lib/flow";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const now   = new Date();
    const year  = now.getFullYear();
    const month = now.getMonth();

    const startOfMonth   = new Date(year, month, 1);
    const endOfMonth     = new Date(year, month + 1, 0, 23, 59, 59);
    const prevMonthStart = new Date(year, month - 1, 1);
    const prevMonthEnd   = new Date(year, month, 0, 23, 59, 59);

    const baseWhere = { userId, isExcluded: false };

    const [incomeAgg, budgetItems, catExpenses, prevCatExpenses] = await Promise.all([
      prisma.transaction.aggregate({
        where: { ...baseWhere, isIncome: true, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.budget.findMany({
        where: { userId, year, month: month + 1 },
        select: { amount: true, categoryId: true },
      }),
      prisma.transaction.findMany({
        where: { ...baseWhere, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
        select: { categoryId: true, amount: true, category: { select: { flowType: true } } },
      }),
      prisma.transaction.findMany({
        where: { ...baseWhere, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } },
        select: { amount: true, category: { select: { flowType: true } } },
      }),
    ]);

    const income = Number(incomeAgg._sum.amount ?? 0);

    const spentMap: Record<string, number> = {};
    for (const r of catExpenses) {
      if (r.categoryId) spentMap[r.categoryId] = (spentMap[r.categoryId] ?? 0) + Number(r.amount);
    }

    const flowRows = catExpenses.map(r => ({
      amount: Number(r.amount),
      flowType: (r.category?.flowType ?? "CONSUMPTION") as import("@/lib/flow").CategoryFlowType,
    }));
    const flow = computeFlowSummary(income, flowRows);
    const savingsRateRaw = flow.savingsRate !== null ? flow.savingsRate / 100 : 0;

    const prevFlowRows = prevCatExpenses.map(r => ({
      amount: Number(r.amount),
      flowType: (r.category?.flowType ?? "CONSUMPTION") as import("@/lib/flow").CategoryFlowType,
    }));
    const prevFlow = computeFlowSummary(0, prevFlowRows);
    const prevConsumption = prevFlow.consumption;

    let overBudgetCount = 0;
    let totalBudget = 0;
    for (const b of budgetItems) {
      const bAmt = Number(b.amount);
      totalBudget += bAmt;
      if ((spentMap[b.categoryId] ?? 0) > bAmt) overBudgetCount++;
    }

    let score = 50;
    const savingsRate = savingsRateRaw;
    if      (savingsRate >= 0.3) score += 30;
    else if (savingsRate >= 0.2) score += 20;
    else if (savingsRate >= 0.1) score += 10;
    else if (savingsRate < 0)    score -= 20;

    if (prevConsumption > 0) {
      const changeRate = (flow.consumption - prevConsumption) / prevConsumption;
      if      (changeRate <= -0.1) score += 15;
      else if (changeRate <= 0)    score += 5;
      else if (changeRate > 0.2)   score -= 15;
      else if (changeRate > 0.1)   score -= 5;
    }

    score -= overBudgetCount * 5;
    if (budgetItems.length > 0) score += 5;
    score = Math.max(0, Math.min(100, score));

    const level =
      score >= 80 ? "excellent" :
      score >= 60 ? "good" :
      score >= 40 ? "fair" : "poor";

    const levelLabel =
      score >= 80 ? "매우 좋음" :
      score >= 60 ? "좋음" :
      score >= 40 ? "보통" : "주의 필요";

    const tips: string[] = [];
    if (savingsRateRaw < 0.1 && income > 0) tips.push("저축률을 10% 이상으로 높여보세요.");
    if (overBudgetCount > 0)             tips.push(`예산을 초과한 카테고리가 ${overBudgetCount}개 있어요.`);
    if (budgetItems.length === 0)        tips.push("카테고리별 예산을 설정하면 점수가 올라가요.");
    if (prevConsumption > 0 && (flow.consumption - prevConsumption) / prevConsumption > 0.1)
      tips.push("소비 지출이 전월 대비 10% 이상 증가했어요.");

    return NextResponse.json({
      score, level, levelLabel,
      savingsRate: flow.savingsRate,
      consumption: flow.consumption,
      savings: flow.savings,
      investment: flow.investment,
      overBudgetCount,
      totalBudget,
      tips,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
