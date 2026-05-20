import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const DAY_LABELS = ["일", "월", "화", "수", "목", "금", "토"];

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);
  const prevMonthStart = new Date(year, month - 2, 1);
  const prevMonthEnd = new Date(year, month - 1, 0, 23, 59, 59);

  // ── 이번 달 & 전달 집계 ──
  const [incomeAgg, expenseAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
    prisma.transaction.aggregate({ where: { userId, isIncome: true,  date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, isIncome: true,  date: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
    prisma.transaction.aggregate({ where: { userId, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
  ]);

  const income     = Number(incomeAgg._sum.amount     ?? 0);
  const expense    = Number(expenseAgg._sum.amount    ?? 0);
  const prevIncome  = Number(prevIncomeAgg._sum.amount  ?? 0);
  const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);

  const incomeChange  = prevIncome  > 0 ? Math.round(((income  - prevIncome)  / prevIncome)  * 100) : null;
  const expenseChange = prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null;
  const savingsRate   = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

  // ── 카테고리별 지출 ──
  const categoryExpenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
  });

  const categoryIds = categoryExpenses.map((c) => c.categoryId).filter(Boolean) as string[];
  const categories  = await prisma.category.findMany({ where: { id: { in: categoryIds } } });
  const catMap      = new Map(categories.map((c) => [c.id, c]));

  const categoryData = categoryExpenses
    .filter((c) => c.categoryId)
    .map((c) => ({
      name:   catMap.get(c.categoryId!)?.name  ?? "기타",
      icon:   catMap.get(c.categoryId!)?.icon  ?? "📦",
      color:  catMap.get(c.categoryId!)?.color ?? "#4B5563",
      amount: Number(c._sum.amount ?? 0),
    }));

  // ── 전달 카테고리별 지출 (비교용) ──
  const prevCatExpenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } },
    _sum: { amount: true },
  });
  const prevCatMap = new Map(prevCatExpenses.map((c) => [c.categoryId, Number(c._sum.amount ?? 0)]));

  const categoryDataWithDiff = categoryData.map((c) => {
    const cat    = categories.find((x) => x.name === c.name);
    const prev   = cat ? (prevCatMap.get(cat.id) ?? 0) : 0;
    const diff   = prev > 0 ? Math.round(((c.amount - prev) / prev) * 100) : null;
    return { ...c, prevAmount: prev, diff };
  });

  // ── 상위 지출처 TOP 10 ──
  const topMerchants = await prisma.transaction.groupBy({
    by: ["description"],
    where: { userId, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
    _count: { id: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 10,
  });

  // ── 이번 달 전체 지출 트랜잭션 (주간/요일 분석용) ──
  const monthTx = await prisma.transaction.findMany({
    where: { userId, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
    select: { date: true, amount: true },
  });

  // 주차별 지출
  const weekMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const tx of monthTx) {
    const week = Math.ceil(tx.date.getDate() / 7);
    weekMap[week] = (weekMap[week] ?? 0) + Number(tx.amount);
  }
  const weeklyData = [1, 2, 3, 4, 5]
    .filter((w) => weekMap[w] > 0)
    .map((w) => ({ week: `${w}주차`, amount: weekMap[w] }));

  // 요일별 지출
  const dowMap: number[] = [0, 0, 0, 0, 0, 0, 0];
  for (const tx of monthTx) {
    dowMap[tx.date.getDay()] += Number(tx.amount);
  }
  const dowData = dowMap.map((amount, i) => ({ day: DAY_LABELS[i], amount }));

  // 하루 평균 지출
  const daysInMonth = endOfMonth.getDate();
  const today       = year === now.getFullYear() && month === now.getMonth() + 1
    ? now.getDate() : daysInMonth;
  const dailyAvg = today > 0 ? Math.round(expense / today) : 0;

  // ── 최근 6개월 월별 수입/지출 ──
  const sixMonthsAgo = new Date(year, month - 6, 1);
  const allTx = await prisma.transaction.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    select: { date: true, amount: true, isIncome: true },
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d   = new Date(year, month - 1 - i, 1);
    const key = `${d.getMonth() + 1}월`;
    monthlyMap.set(key, { income: 0, expense: 0 });
  }
  for (const tx of allTx) {
    const key = `${tx.date.getMonth() + 1}월`;
    if (!monthlyMap.has(key)) continue;
    const cur = monthlyMap.get(key)!;
    if (tx.isIncome) cur.income += Number(tx.amount);
    else             cur.expense += Number(tx.amount);
  }
  const monthlyData = Array.from(monthlyMap.entries()).map(([m, v]) => ({ month: m, ...v }));

  // ── 자동 인사이트 생성 ──
  const insights: string[] = [];

  if (expenseChange !== null) {
    if (expenseChange > 10)
      insights.push(`지출이 전월 대비 ${expenseChange}% 증가했어요. 지출 항목을 점검해보세요.`);
    else if (expenseChange < -10)
      insights.push(`지출이 전월 대비 ${Math.abs(expenseChange)}% 감소했어요. 잘 절약하고 있어요! 👍`);
  }

  if (savingsRate !== null) {
    if (savingsRate >= 30)
      insights.push(`이번 달 저축률은 ${savingsRate}%예요. 훌륭한 재정 관리예요!`);
    else if (savingsRate < 0)
      insights.push(`이번 달은 수입보다 지출이 많아요. 예산을 점검해보세요.`);
    else
      insights.push(`이번 달 저축률은 ${savingsRate}%예요.`);
  }

  if (categoryDataWithDiff.length > 0) {
    const top = categoryDataWithDiff[0];
    const pct = expense > 0 ? Math.round((top.amount / expense) * 100) : 0;
    insights.push(`${top.icon} ${top.name}이(가) 전체 지출의 ${pct}%로 가장 많아요.`);
    if (top.diff !== null && top.diff > 20)
      insights.push(`${top.name} 지출이 전월 대비 ${top.diff}% 늘었어요.`);
  }

  if (dailyAvg > 0)
    insights.push(`하루 평균 지출은 ${dailyAvg.toLocaleString()}원이에요.`);

  const maxDow = dowData.reduce((a, b) => (a.amount > b.amount ? a : b), dowData[0]);
  if (maxDow && maxDow.amount > 0)
    insights.push(`${maxDow.day}요일에 가장 많이 지출했어요.`);

  return NextResponse.json({
    income, expense, prevIncome, prevExpense,
    incomeChange, expenseChange, savingsRate,
    categoryData: categoryDataWithDiff,
    monthlyData,
    topMerchants: topMerchants.map((m) => ({
      name: m.description,
      amount: Number(m._sum.amount ?? 0),
      count: m._count.id,
    })),
    weeklyData,
    dowData,
    dailyAvg,
    insights,
  });
}
