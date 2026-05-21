import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { budgetUpsertSchema, safeParse } from "@/lib/schemas";

const BUDGETS_LIMIT  = 1;
const BUDGETS_WINDOW = 5 * 1000;

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const rl = checkRateLimit(`budgets:${session.user.id}`, BUDGETS_LIMIT, BUDGETS_WINDOW);
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

    const [budgets, categories] = await Promise.all([
      prisma.budget.findMany({
        where: { userId: session.user.id, year, month },
        include: { category: true },
      }),
      prisma.category.findMany({ orderBy: { name: "asc" } }),
    ]);

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth   = new Date(year, month, 0, 23, 59, 59);

    const expenses = await prisma.transaction.groupBy({
      by: ["categoryId"],
      where: { userId: session.user.id, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
      _sum: { amount: true },
    });

    const expenseRecord: Record<string, number> = {};
    for (const e of expenses) {
      if (e.categoryId) expenseRecord[e.categoryId] = Number(e._sum.amount ?? 0);
    }
    const budgetRecord: Record<string, number> = {};
    for (const b of budgets) budgetRecord[b.categoryId] = Number(b.amount);

    const result = categories.map((cat: { id: string; name: string; icon: string | null; color: string | null }) => ({
      categoryId:    cat.id,
      categoryName:  cat.name,
      categoryIcon:  cat.icon  ?? "📦",
      categoryColor: cat.color ?? "#4B5563",
      budget: budgetRecord[cat.id] ?? 0,
      spent:  expenseRecord[cat.id] ?? 0,
    }));

    return NextResponse.json({ year, month, items: result });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const body   = await req.json();
    const parsed = safeParse(budgetUpsertSchema, {
      categoryId: body.categoryId,
      year:       Number(body.year),
      month:      Number(body.month),
      amount:     Number(body.amount),
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { categoryId, year, month, amount } = parsed.data;

    const budget = await prisma.budget.upsert({
      where: { userId_categoryId_year_month: { userId: session.user.id, categoryId, year, month } },
      update: { amount },
      create: { userId: session.user.id, categoryId, year, month, amount },
      include: { category: true },
    });

    return NextResponse.json(budget);
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
