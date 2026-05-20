import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/transactions?year=2026&month=5&search=&categoryId=&type=all&page=1
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const now = new Date();
  const year = parseInt(searchParams.get("year") ?? String(now.getFullYear()));
  const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
  const search = searchParams.get("search") ?? "";
  const categoryId = searchParams.get("categoryId") ?? "";
  const type = searchParams.get("type") ?? "all"; // all | income | expense
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
  const PAGE_SIZE = 30;

  const startOfMonth = new Date(year, month - 1, 1);
  const endOfMonth = new Date(year, month, 0, 23, 59, 59);

  const where = {
    userId: session.user.id,
    date: { gte: startOfMonth, lte: endOfMonth },
    ...(search ? { description: { contains: search, mode: "insensitive" as const } } : {}),
    ...(categoryId ? { categoryId } : {}),
    ...(type === "income" ? { isIncome: true } : type === "expense" ? { isIncome: false } : {}),
  };

  const [total, transactions] = await Promise.all([
    prisma.transaction.count({ where }),
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
      include: { category: true },
    }),
  ]);

  return NextResponse.json({
    transactions,
    total,
    page,
    totalPages: Math.ceil(total / PAGE_SIZE),
  });
}
