import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/budgets?year=2026&month=5
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));

  const [budgets, categories] = await Promise.all([
    prisma.budget.findMany({
      where: { userId: session.user.id, year, month },
      include: { category: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  // 이번 달 카테고리별 실제 지출
  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const expenses = await prisma.transaction.groupBy({
    by: ["categoryId"],
    where: {
      userId: session.user.id,
      isIncome: false,
      date: { gte: startOfMonth, lte: endOfMonth },
    },
    _sum: { amount: true },
  });

  type ExpRow = (typeof expenses)[number];
  type BudgetRow = (typeof budgets)[number];
  const expenseMap = new Map(
    expenses.map((e: ExpRow) => [e.categoryId ?? "null", Number(e._sum.amount ?? 0)])
  );
  const budgetMap = new Map(budgets.map((b: BudgetRow) => [b.categoryId, b]));

  type CatRow = (typeof categories)[number];
  const result = categories.map((cat: CatRow) => ({
    categoryId: cat.id,
    categoryName: cat.name,
    categoryIcon: cat.icon ?? "📦",
    categoryColor: cat.color ?? "#4B5563",
    budget: Number(budgetMap.get(cat.id)?.amount ?? 0),
    spent: expenseMap.get(cat.id) ?? 0,
  }));

  return NextResponse.json({ year, month, items: result });
}

// POST /api/budgets  { categoryId, year, month, amount }
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { categoryId, year, month, amount } = await req.json();

  if (!categoryId || !year || !month || amount === undefined) {
    return NextResponse.json({ error: "필수 항목이 누락됐습니다." }, { status: 400 });
  }

  const budget = await prisma.budget.upsert({
    where: { userId_categoryId_year_month: { userId: session.user.id, categoryId, year, month } },
    update: { amount },
    create: { userId: session.user.id, categoryId, year, month, amount },
    include: { category: true },
  });

  return NextResponse.json(budget);
}
