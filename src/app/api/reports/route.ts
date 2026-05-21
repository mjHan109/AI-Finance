import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";

const DAY_LABELS     = ["일", "월", "화", "수", "목", "금", "토"];
const REPORTS_LIMIT  = 1;
const REPORTS_WINDOW = 10 * 1000;

/** Normalize merchant name: strip branch suffixes, parentheticals, trailing IDs */
function normalizeMerchant(desc: string): string {
  const result = desc
    .replace(/[（(（][^）)）]*[）)）]/g, "")  // (강남점), （괄호）
    .replace(/\s+\S{1,6}점\s*$/u, "")         // 강남점, 홍대점
    .replace(/\s+\d+호점\s*$/u, "")            // 1호점
    .replace(/\s+#?\d{3,}\s*$/g, "")           // trailing numeric IDs
    .trim();
  return result || desc.trim();
}

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  const rl = checkRateLimit(`reports:${userId}`, REPORTS_LIMIT, REPORTS_WINDOW);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초 후)` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const now   = new Date();
    const year  = parseInt(searchParams.get("year")  ?? String(now.getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

    const startOfMonth   = new Date(year, month - 1, 1);
    const endOfMonth     = new Date(year, month, 0, 23, 59, 59);
    const prevMonthStart = new Date(year, month - 2, 1);
    const prevMonthEnd   = new Date(year, month - 1, 0, 23, 59, 59);

    const [incomeAgg, expenseAgg, prevIncomeAgg, prevExpenseAgg] = await Promise.all([
      prisma.transaction.aggregate({ where: { userId, isExcluded: false, isIncome: true,  date: { gte: startOfMonth,  lte: endOfMonth   } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth,  lte: endOfMonth   } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, isExcluded: false, isIncome: true,  date: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
      prisma.transaction.aggregate({ where: { userId, isExcluded: false, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } }, _sum: { amount: true } }),
    ]);

    const income      = Number(incomeAgg._sum.amount      ?? 0);
    const expense     = Number(expenseAgg._sum.amount     ?? 0);
    const prevIncome  = Number(prevIncomeAgg._sum.amount  ?? 0);
    const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);

    const incomeChange  = prevIncome  > 0 ? Math.round(((income  - prevIncome)  / prevIncome)  * 100) : null;
    const expenseChange = prevExpense > 0 ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null;
    const savingsRate   = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

    // ── 카테고리별 지출 ──
    const categoryExpenses = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
      orderBy: { _sum: { amount: "desc" } },
    });

    type CatExpRow = (typeof categoryExpenses)[number];

    const categoryIds = categoryExpenses
      .map((c: CatExpRow) => c.categoryId)
      .filter((id: string | null): id is string => id !== null);

    const categories = await prisma.category.findMany({ where: { id: { in: categoryIds } } });

    const catRecord: Record<string, { name: string; icon: string | null; color: string | null }> = {};
    for (const c of categories) catRecord[c.id] = c;

    const categoryData = categoryExpenses
      .filter((c: CatExpRow) => c.categoryId !== null)
      .map((c: CatExpRow) => ({
        name:   catRecord[c.categoryId!]?.name  ?? "기타",
        icon:   catRecord[c.categoryId!]?.icon  ?? "📦",
        color:  catRecord[c.categoryId!]?.color ?? "#4B5563",
        amount: Number(c._sum.amount ?? 0),
      }));

    // ── 전달 카테고리별 지출 ──
    const prevCatExpenses = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId, isExcluded: false, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    });

    type PrevCatExpRow = (typeof prevCatExpenses)[number];
    const prevCatRecord: Record<string, number> = {};
    for (const c of prevCatExpenses) {
      const row = c as PrevCatExpRow;
      if (row.categoryId) prevCatRecord[row.categoryId] = Number(row._sum.amount ?? 0);
    }

    const categoryDataWithDiff = categoryData.map((c) => {
      const cat  = categories.find((x) => x.name === c.name);
      const prev = cat ? (prevCatRecord[cat.id] ?? 0) : 0;
      const diff = prev > 0 ? Math.round(((c.amount - prev) / prev) * 100) : null;
      return { ...c, prevAmount: prev, diff };
    });

    // ── Merchant grouping (normalized) ──
    const expenseTx = await prisma.transaction.findMany({
      where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { description: true, amount: true },
    });

    const merchantMap: Record<string, { amount: number; count: number }> = {};
    for (const tx of expenseTx) {
      const name = normalizeMerchant(tx.description);
      if (!merchantMap[name]) merchantMap[name] = { amount: 0, count: 0 };
      merchantMap[name].amount += Number(tx.amount);
      merchantMap[name].count  += 1;
    }
    const topMerchants = Object.entries(merchantMap)
      .map(([name, v]) => ({ name, amount: Math.round(v.amount), count: v.count }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // ── 주간/요일 분석 ──
    const monthTx = await prisma.transaction.findMany({
      where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      select: { date: true, amount: true },
    });

    const weekMap: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    const dowMap: number[] = [0, 0, 0, 0, 0, 0, 0];
    for (const tx of monthTx) {
      const week = Math.ceil(tx.date.getDate() / 7);
      weekMap[week] = (weekMap[week] ?? 0) + Number(tx.amount);
      dowMap[tx.date.getDay()] += Number(tx.amount);
    }

    const weeklyData = [1, 2, 3, 4, 5]
      .filter((w) => weekMap[w] > 0)
      .map((w) => ({ week: `${w}주차`, amount: weekMap[w] }));

    const dowData = dowMap.map((amount, i) => ({ day: DAY_LABELS[i], amount }));

    const daysInMonth = endOfMonth.getDate();
    const today = year === now.getFullYear() && month === now.getMonth() + 1 ? now.getDate() : daysInMonth;
    const dailyAvg = today > 0 ? Math.round(expense / today) : 0;

    // ── 최근 6개월 월별 ──
    const sixMonthsAgo = new Date(year, month - 6, 1);
    const allTx = await prisma.transaction.findMany({
      where: { userId, isExcluded: false, date: { gte: sixMonthsAgo } },
      select: { date: true, amount: true, isIncome: true },
    });

    const monthlyMap = new Map<string, { income: number; expense: number }>();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(year, month - 1 - i, 1);
      monthlyMap.set(`${d.getMonth() + 1}월`, { income: 0, expense: 0 });
    }
    for (const tx of allTx) {
      const key = `${tx.date.getMonth() + 1}월`;
      if (!monthlyMap.has(key)) continue;
      const cur = monthlyMap.get(key)!;
      if (tx.isIncome) cur.income += Number(tx.amount);
      else             cur.expense += Number(tx.amount);
    }
    const monthlyData = Array.from(monthlyMap.entries()).map(([m, v]) => ({ month: m, ...v }));

    // ── 규칙 기반 인사이트 ──
    const insights: string[] = [];
    if (expenseChange !== null) {
      if (expenseChange > 10)       insights.push(`지출이 전월 대비 ${expenseChange}% 증가했어요. 지출 항목을 점검해보세요.`);
      else if (expenseChange < -10) insights.push(`지출이 전월 대비 ${Math.abs(expenseChange)}% 감소했어요. 잘 절약하고 있어요! 👍`);
    }
    if (savingsRate !== null) {
      if (savingsRate >= 30)    insights.push(`이번 달 저축률은 ${savingsRate}%예요. 훌륭한 재정 관리예요!`);
      else if (savingsRate < 0) insights.push(`이번 달은 수입보다 지출이 많아요. 예산을 점검해보세요.`);
      else                      insights.push(`이번 달 저축률은 ${savingsRate}%예요.`);
    }
    if (categoryDataWithDiff.length > 0) {
      const top = categoryDataWithDiff[0];
      const pct = expense > 0 ? Math.round((top.amount / expense) * 100) : 0;
      insights.push(`${top.icon} ${top.name}이(가) 전체 지출의 ${pct}%로 가장 많아요.`);
      if (top.diff !== null && top.diff > 20) insights.push(`${top.name} 지출이 전월 대비 ${top.diff}% 늘었어요.`);
    }
    if (dailyAvg > 0) insights.push(`하루 평균 지출은 ${dailyAvg.toLocaleString()}원이에요.`);
    const maxDow = dowData.reduce((a, b) => (a.amount > b.amount ? a : b), dowData[0]);
    if (maxDow && maxDow.amount > 0) insights.push(`${maxDow.day}요일에 가장 많이 지출했어요.`);

    return NextResponse.json({
      income, expense, prevIncome, prevExpense,
      incomeChange, expenseChange, savingsRate,
      categoryData: categoryDataWithDiff,
      monthlyData,
      topMerchants,
      weeklyData,
      dowData,
      dailyAvg,
      insights,
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
