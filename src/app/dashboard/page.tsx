import Link from "next/link";
import { TrendingDown, TrendingUp, Wallet, ArrowRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { MonthlyBar } from "@/components/charts/MonthlyBar";

async function getDashboardData(userId: string) {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();

  const startOfMonth = new Date(year, month, 1);
  const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59);

  // 이번 달 요약
  const [incomeAgg, expenseAgg, recentTx] = await Promise.all([
    prisma.transaction.aggregate({
      where: { userId, isIncome: true, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.aggregate({
      where: { userId, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    }),
    prisma.transaction.findMany({
      where: { userId },
      orderBy: { date: "desc" },
      take: 5,
      include: { category: true },
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

  const categoryIds = categoryExpenses.map((c) => c.categoryId).filter(Boolean) as string[];
  const categories = await prisma.category.findMany({
    where: { id: { in: categoryIds } },
  });
  const catMap = new Map(categories.map((c) => [c.id, c]));

  const categoryData = categoryExpenses
    .filter((c) => c.categoryId)
    .map((c) => {
      const cat = catMap.get(c.categoryId!)!;
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

  return {
    income: Number(incomeAgg._sum.amount ?? 0),
    expense: Number(expenseAgg._sum.amount ?? 0),
    recentTx,
    categoryData,
    monthlyData,
    label: `${year}년 ${month + 1}월`,
  };
}

function formatKRW(amount: number) {
  if (amount >= 10000) {
    const man = Math.floor(amount / 10000);
    const rem = amount % 10000;
    return rem > 0 ? `${man.toLocaleString()}만 ${rem.toLocaleString()}원` : `${man.toLocaleString()}만원`;
  }
  return `${amount.toLocaleString()}원`;
}

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const { income, expense, recentTx, categoryData, monthlyData, label } =
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingUp size={14} className="text-emerald-400" /> 이번 달 수입
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-emerald-400">
              {hasData ? formatKRW(income) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <TrendingDown size={14} className="text-destructive" /> 이번 달 지출
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-destructive">
              {hasData ? formatKRW(expense) : "-"}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
              <Wallet size={14} className="text-primary" /> 순 잔액
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${balance >= 0 ? "text-primary" : "text-destructive"}`}>
              {hasData ? formatKRW(balance) : "-"}
            </p>
          </CardContent>
        </Card>
      </div>

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
            <ul className="divide-y divide-border">
              {recentTx.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <span className="text-lg">{tx.category?.icon ?? "💳"}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category?.name ?? "미분류"} · {new Date(tx.date).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${!tx.isIncome ? "text-destructive" : "text-emerald-400"}`}>
                    {!tx.isIncome ? "-" : "+"}{formatKRW(Number(tx.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
