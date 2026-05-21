import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalCreateSchema, safeParse } from "@/lib/schemas";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const goals = await prisma.goal.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json(goals);
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
    const parsed = safeParse(goalCreateSchema, {
      ...body,
      targetAmount: Number(body.targetAmount),
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, icon, targetAmount, targetDate } = parsed.data;

    const count = await prisma.goal.count({ where: { userId: session.user.id } });
    if (count >= 20) {
      return NextResponse.json({ error: "목표는 최대 20개까지 만들 수 있어요." }, { status: 400 });
    }

    const goal = await prisma.goal.create({
      data: {
        userId:       session.user.id,
        name:         name.slice(0, 50),
        icon:         icon ? String(icon).slice(0, 10) : "🎯",
        targetAmount,
        targetDate:   targetDate ? new Date(targetDate) : null,
      },
    });

    return NextResponse.json(goal, { status: 201 });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
