import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const goals = await prisma.goal.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(goals);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  const body = await req.json();
  const { name, icon, targetAmount, targetDate } = body;

  if (!name || !targetAmount || Number(targetAmount) <= 0) {
    return NextResponse.json({ error: "목표 이름과 금액은 필수입니다." }, { status: 400 });
  }

  // 최대 20개 제한
  const count = await prisma.goal.count({ where: { userId: session.user.id } });
  if (count >= 20) {
    return NextResponse.json({ error: "목표는 최대 20개까지 만들 수 있어요." }, { status: 400 });
  }

  const goal = await prisma.goal.create({
    data: {
      userId: session.user.id,
      name: String(name).trim().slice(0, 50),
      icon: icon ? String(icon).slice(0, 10) : "🎯",
      targetAmount: Number(targetAmount),
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });

  return NextResponse.json(goal, { status: 201 });
}
