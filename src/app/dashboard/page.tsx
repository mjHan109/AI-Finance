import Link from "next/link";
import { TrendingDown, TrendingUp, Wallet, ArrowRight } from "lucide-react";
import { RecentTransactions } from "@/components/RecentTransactions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { MonthlyBar } from "@/components/charts/MonthlyBar";
import { FinancialHealthCard, type HealthData } from "@/components/FinancialHealthCard";
import { formatKRW } from "@/lib/utils";

async function getDashboardData(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  const prevMonthStart = new Date(year, month - 1, 1);
  const prevMonthEnd   = new Date(year, month, 0, 23, 59, 59);

  // 이번 달 요약
  const [incomeAgg, expenseAgg, prevExpenseAgg, recentTx, allCategories, budgetItems] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, isExcluded: false, isIncome: true,  date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, isExcluded: false, isIncome: false, date: { gte: prevMonthStart, lte: prevMonthEnd } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId, isExcluded: false },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
    prisma.budget.findMany({
      where: { userId, year, month: month + 1 },
      select: { amount: true, categoryId: true },
    }),
  ]);

  // 카테고리별 지출 (이번 달)
  const categoryExpenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: { userId, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: "desc" } },
    take: 6,
  });

  type CatExp = (typeof categoryExpenses)[number];
  const categoryIds = categoryExpenses.map((c: CatExp) => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  type CatRow = (typeof categories)[number];
  const catRecord: Record<string, CatRow> = {};
  for (const c of categories) catRecord[c.id] = c;

  const categoryData = categoryExpenses
    .filter((c: CatExp) => c.categoryId)
    .map((c: CatExp) => {
      const cat = catRecord[c.categoryId!];
      return {
        name: cat?.name ?? "기타",
        icon: cat?.icon ?? "📦",
        color: cat?.color ?? "#4B5563",
        amount: Number(c._sum.amount ?? 0),
      };
    });

  // 최근 6개월 월별 수입/지출
  const sixMonthsAgo = new Date(year, month - 5, 1);
  const allTx = await prisma.transaction.findMany({
    where: { userId, date: { gte: sixMonthsAgo } },
    select: { date: true, amount: true, isIncome: true },
  });

  const monthlyMap = new Map<string, { income: number; expense: number }>();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(year, month - i, 1);
    const key = `${d.getMonth() + 1}월`;
    monthlyMap.set(key, { income: 0, expense: 0 });
  }
  for (const tx of allTx) {
    const key = `${tx.date.getMonth() + 1}월`;
    if (!monthlyMap.has(key)) continue;
    const cur = monthlyMap.get(key)!;
    if (tx.isIncome) cur.income += Number(tx.amount);
    else cur.expense += Number(tx.amount);
  }
  const monthlyData = Array.from(monthlyMap.entries()).map(([month, v]) => ({
    month,
    ...v,
  }));

  const income      = Number(incomeAgg._sum.amount     ?? 0);
  const expense     = Number(expenseAgg._sum.amount    ?? 0);
  const prevExpense = Number(prevExpenseAgg._sum.amount ?? 0);
  const expenseChange = prevExpense > 0
    ? Math.round(((expense - prevExpense) / prevExpense) * 100) : null;
  const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

  // 재정 건강 점수 계산 (health API 쿼리 중복 제거)
  const spentMap: Record<string, number> = {};
  for (const c of categoryExpenses) {
    if (c.categoryId) spentMap[c.categoryId] = Number(c._sum.amount ?? 0);
  }
  let overBudgetCount = 0;
  let totalBudget = 0;
  for (const b of budgetItems) {
    const bAmt = Number(b.amount);
    totalBudget += bAmt;
    if ((spentMap[b.categoryId] ?? 0) > bAmt) overBudgetCount++;
  }
  const savingsRateRaw = income > 0 ? (income - expense) / income : 0;
  let score = 50;
  if      (savingsRateRaw >= 0.3) score += 30;
  else if (savingsRateRaw >= 0.2) score += 20;
  else if (savingsRateRaw >= 0.1) score += 10;
  else if (savingsRateRaw < 0)    score -= 20;
  if (prevExpense > 0) {
    const changeRate = (expense - prevExpense) / prevExpense;
    if      (changeRate <= -0.1) score += 15;
    else if (changeRate <= 0)    score += 5;
    else if (changeRate > 0.2)   score -= 15;
    else if (changeRate > 0.1)   score -= 5;
  }
  score -= overBudgetCount * 5;
  if (budgetItems.length > 0) score += 5;
  score = Math.max(0, Math.min(100, score));
  const level: HealthData["level"] =
    score >= 80 ? "excellent" : score >= 60 ? "good" : score >= 40 ? "fair" : "poor";
  const levelLabel =
    score >= 80 ? "매우 좋음" : score >= 60 ? "좋음" : score >= 40 ? "보통" : "주의 필요";
  const tips: string[] = [];
  if (savingsRateRaw < 0.1 && income > 0) tips.push("저축률을 10% 이상으로 높여보세요.");
  if (overBudgetCount > 0)                tips.push(`예산을 초과한 카테고리가 ${overBudgetCount}개 있어요.`);
  if (budgetItems.length === 0)           tips.push("카테고리별 예산을 설정하면 점수가 올라가요.");
  if (prevExpense > 0 && (expense - prevExpense) / prevExpense > 0.1)
    tips.push("지출이 전월 대비 10% 이상 증가했어요.");
  const healthData: HealthData = {
    score, level, levelLabel,
    savingsRate: income > 0 ? Math.round(savingsRateRaw * 100) : null,
    overBudgetCount, totalBudget, tips,
  };

  return {
    income, expense, expenseChange, savingsRate,
    recentTx, categoryData, monthlyData, allCategories,
    healthData,
    label: `${year}년 ${month + 1}월`,
  };
}


export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { income, expense, expenseChange, savingsRate, recentTx, categoryData, monthlyData, allCategories, healthData, label } =
    await getDashboardData(session.user.id);

  const balance = income - expense;
  const hasData = income > 0 || expense > 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-8">
      {/* 헤더 */}
      <div>
        <p className="text-sm text-muted-foreground">{label}</p>
        <h1 className="text-2xl font-bold text-foreground mt-0.5">
          안녕하세요, {session.user.name ?? "포도"}님 🍇
        </h1>
      </div>

      {/* 요약 카드 */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={12} className="text-emerald-400" /> 이번 달 수입
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold text-emerald-400 tabular-nums">
              {hasData ? formatKRW(income) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingDown size={12} className="text-destructive" /> 이번 달 지출
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className="text-xl font-bold text-destructive tabular-nums">
              {hasData ? formatKRW(expense) : "-"}
            </p>
            {expenseChange !== null && hasData && (
              <p className={`text-xs mt-1 font-medium ${expenseChange > 0 ? "text-red-400" : "text-emerald-400"}`}>
                전월 대비 {expenseChange > 0 ? "▲" : "▼"} {Math.abs(expenseChange)}%
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet size={12} className="text-primary" /> 순 잔액
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className={`text-xl font-bold tabular-nums ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
              {hasData ? `${balance.toLocaleString()}원` : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-1 pt-4">
            <CardTitle className="text-xs font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet size={12} className="text-amber-400" /> 저축률
            </CardTitle>
          </CardHeader>
          <CardContent className="pb-4">
            <p className={`text-xl font-bold tabular-nums ${(savingsRate ?? 0) >= 0 ? "text-amber-400" : "text-destructive"}`}>
              {savingsRate !== null && hasData ? `${savingsRate}%` : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 재정 건강 점수 */}
      <FinancialHealthCard data={healthData} />

      {/* 차트 2개 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">이번 달 카테고리별 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <CategoryDonut data={categoryData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-semibold">월별 수입 / 지출</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyBar data={monthlyData} />
          </CardContent>
        </Card>
      </div>

      {/* 최근 거래 내역 */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base font-semibold">최근 거래 내역</CardTitle>
          <Link href="/dashboard/transactions">
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1">
              전체 보기 <ArrowRight size={13} />
            </Button>
          </Link>
        </CardHeader>
        <CardContent>
          {recentTx.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <p className="text-4xl">📂</p>
              <p className="text-sm text-muted-foreground">아직 거래 내역이 없어요</p>
              <Link href="/upload">
                <Button size="sm" className="mt-1">파일 업로드하기</Button>
              </Link>
            </div>
          ) : (
            <RecentTransactions transactions={recentTx} categories={allCategories} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
