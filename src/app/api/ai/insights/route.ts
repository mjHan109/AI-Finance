import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Anthropic from "@anthropic-ai/sdk";
import { insightsQuerySchema, safeParse } from "@/lib/schemas";
import { log } from "@/lib/logger";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

// Cache TTL: 24 hours — re-use AiReport within same day
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const body   = await req.json();
    const parsed = safeParse(insightsQuerySchema, body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { year, month } = parsed.data;

    // Check cache
    const cached = await prisma.aiReport.findUnique({
      where: { userId_year_month: { userId, year, month } },
    });
    if (cached) {
      const age = Date.now() - cached.createdAt.getTime();
      if (age < CACHE_TTL_MS) {
        return NextResponse.json({ insights: JSON.parse(cached.content), cached: true });
      }
    }

    // Gather anonymized spending summary for Claude
    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth   = new Date(year, month, 0, 23, 59, 59);

    const [incomeAgg, expenseAgg, categoryExpenses, budgetItems] = await Promise.all([
      prisma.transaction.aggregate({
        where: { userId, isExcluded: false, isIncome: true, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
      }),
      prisma.transaction.groupBy({
        by: ["categoryId"],
        where: { userId, isExcluded: false, isIncome: false, date: { gte: startOfMonth, lte: endOfMonth } },
        _sum: { amount: true },
        orderBy: { _sum: { amount: "desc" } },
        take: 6,
      }),
      prisma.budget.findMany({
        where: { userId, year, month },
        include: { category: true },
      }),
    ]);

    const income  = Number(incomeAgg._sum.amount  ?? 0);
    const expense = Number(expenseAgg._sum.amount ?? 0);

    if (income === 0 && expense === 0) {
      return NextResponse.json({ error: "이 달의 거래 내역이 없어요." }, { status: 422 });
    }

    const catIds = categoryExpenses.map((c) => c.categoryId).filter(Boolean) as string[];
    const cats   = await prisma.category.findMany({ where: { id: { in: catIds } } });
    const catMap: Record<string, string> = {};
    for (const c of cats) catMap[c.id] = c.name;

    const categoryLines = categoryExpenses.map((c) => {
      const name   = c.categoryId ? (catMap[c.categoryId] ?? "기타") : "기타";
      const amount = Number(c._sum.amount ?? 0);
      const pct    = expense > 0 ? Math.round((amount / expense) * 100) : 0;
      return `  - ${name}: ${amount.toLocaleString()}원 (${pct}%)`;
    }).join("\n");

    const budgetLines = budgetItems.map((b) => {
      return `  - ${b.category.name}: 예산 ${Number(b.amount).toLocaleString()}원`;
    }).join("\n") || "  없음";

    const savingsRate = income > 0 ? Math.round(((income - expense) / income) * 100) : null;

    const prompt = `당신은 개인 재정 분석 어시스턴트입니다. 아래 ${year}년 ${month}월 지출 데이터를 분석해서 실용적인 인사이트 3~5개를 JSON 배열로만 응답해주세요.

데이터:
- 총 수입: ${income.toLocaleString()}원
- 총 지출: ${expense.toLocaleString()}원
- 저축률: ${savingsRate !== null ? savingsRate + "%" : "데이터 없음"}

카테고리별 지출:
${categoryLines}

설정된 예산:
${budgetLines}

규칙:
1. 응답은 반드시 JSON 배열 형식 ["인사이트1", "인사이트2", ...]
2. 각 항목은 한국어로 1~2문장
3. 구체적인 수치를 포함해서 실용적으로 작성
4. 개인 정보 없음 (이름, 장소 등 언급 금지)
5. JSON 외 다른 텍스트 없음`;

    const message = await client.messages.create({
      model:      "claude-haiku-4-5-20251001",
      max_tokens: 512,
      messages:   [{ role: "user", content: prompt }],
    });

    const text = message.content[0].type === "text" ? message.content[0].text : "[]";
    let insights: string[] = [];
    try {
      const raw = text.match(/\[[\s\S]*\]/)?.[0] ?? "[]";
      insights  = JSON.parse(raw);
      if (!Array.isArray(insights)) insights = [];
    } catch {
      insights = [];
    }

    // Upsert cache
    await prisma.aiReport.upsert({
      where:  { userId_year_month: { userId, year, month } },
      update: { content: JSON.stringify(insights), createdAt: new Date() },
      create: { userId, year, month, content: JSON.stringify(insights) },
    });

    log("info", "ai_insight", { userId, year, month, count: insights.length });
    return NextResponse.json({ insights, cached: false });
  } catch {
    log("error", "server_error", { route: "POST /api/ai/insights" });
    return NextResponse.json({ error: "AI 인사이트 생성에 실패했습니다." }, { status: 500 });
  }
}
