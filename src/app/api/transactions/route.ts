import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// GET /api/transactions?year=2026&month=5&search=&categoryId=&type=all&page=1
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const now = new Date();
    const year  = parseInt(searchParams.get("year")  ?? String(now.getFullYear()));
    const month = parseInt(searchParams.get("month") ?? String(now.getMonth() + 1));
    const search     = (searchParams.get("search") ?? "").slice(0, 100); // 길이 제한
    const rawCatId   = searchParams.get("categoryId") ?? "";
    const type       = searchParams.get("type") ?? "all";
    const page       = Math.max(1, parseInt(searchParams.get("page") ?? "1"));
    const PAGE_SIZE  = 30;

    // categoryId UUID 형식 검증
    const categoryId = rawCatId && UUID_RE.test(rawCatId) ? rawCatId : "";

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth   = new Date(year, month,     0, 23, 59, 59);

    const where = {
      userId:     session.user.id,
      isExcluded: false,
      date: { gte: startOfMonth, lte: endOfMonth },
      ...(search     ? { description: { contains: search, mode: "insensitive" as const } } : {}),
      ...(categoryId ? { categoryId } : {}),
      ...(type === "income"  ? { isIncome: true  } :
          type === "expense" ? { isIncome: false } : {}),
    };

    const [total, transactions] = await Promise.all([
      prisma.transaction.count({ where }),
      prisma.transaction.findMany({
        where,
        orderBy: { date: "desc" },
        skip:    (page - 1) * PAGE_SIZE,
        take:    PAGE_SIZE,
        include: { category: true },
      }),
    ]);

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / PAGE_SIZE),
    });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
