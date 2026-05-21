import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startOfMonth  = new Date(year, month, 1);
  const endOfMonth    = new Date(year, month + 1, 0, 23, 59, 59);
  const prevMonthStart = new Date(year, month - 1, 1);
  const prevMonthEnd   = new Date(year, month, 0, 23, 59, 59);

  const baseWhere = { userId, isExcluded: false };

  const [incomeAgg, expenseAgg, prevExpenseAgg, budgetItems] = await Promise.all([
    prisma.transaction.aggregate({
      where: { ...baseWhere, isIncome: true, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { ...baseWhere, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.budget.findMany({
      where: { userId, year, month: month + 1 },
      select: { amount: true, categoryId: true },
    }),
  ]);

  const income      = Number(incomeAgg._sum.amount  ?? 0);
  const expense     = Number(expenseAgg._sum.amount ?? 0);
  const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);

  // 카테고리별 지출 (예산 대비)
  const catExpenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { ...baseWhere, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
  });

  type CatExpRow = (typeof catExpenses)[number];
  const spentMap: Record<string, number> = {};
  for (const r of catExpenses as CatExpRow[]) {
    if (r.categoryId) spentMap[r.categoryId] = Number(r._sum.amount ?? 0);
  }

  // 예산 초과 카테고리 수
  let overBudgetCount = 0;
  let totalBudget = 0;
  for (const b of budgetItems) {
    const bAmt = Number(b.amount);
    totalBudget += bAmt;
    if ((spentMap[b.categoryId] ?? 0) > bAmt) overBudgetCount++;
  }

  // 점수 계산 (100점 만점)
  let score = 50; // 기본

  // 저축률 (+30)
  const savingsRate = income > 0 ? (income - expense) / income : 0;
  if (savingsRate >= 0.3) score += 30;
  else if (savingsRate >= 0.2) score += 20;
  else if (savingsRate >= 0.1) score += 10;
  else if (savingsRate < 0) score -= 20;

  // 전월 대비 지출 변화 (+/-15)
  if (prevExpense > 0) {
    const changeRate = (expense - prevExpense) / prevExpense;
    if (changeRate <= -0.1) score += 15;
    else if (changeRate <= 0) score += 5;
    else if (changeRate > 0.2) score -= 15;
    else if (changeRate > 0.1) score -= 5;
  }

  // 예산 초과 수 (-5 per category)
  score -= overBudgetCount * 5;

  // 예산 설정 여부 (+5)
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
  if (savingsRate < 0.1 && income > 0) tips.push("저축률을 10% 이상으로 높여보세요.");
  if (overBudgetCount > 0) tips.push(`예산을 초과한 카테고리가 ${overBudgetCount}개 있어요.`);
  if (budgetItems.length === 0) tips.push("카테고리별 예산을 설정하면 점수가 올라가요.");
  if (prevExpense > 0 && (expense - prevExpense) / prevExpense > 0.1)
    tips.push("지출이 전월 대비 10% 이상 증가했어요.");

  return NextResponse.json({
    score,
    level,
    levelLabel,
    savingsRate: income > 0 ? Math.round(savingsRate * 100) : null,
    overBudgetCount,
    totalBudget,
    tips,
  });
}
