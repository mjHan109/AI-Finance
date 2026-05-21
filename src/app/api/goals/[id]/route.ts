import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { goalPatchSchema, safeParse } from "@/lib/schemas";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "없는 목표입니다." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = safeParse(goalPatchSchema, {
      ...body,
      targetAmount: body.targetAmount !== undefined ? Number(body.targetAmount) : undefined,
      savedAmount:  body.savedAmount  !== undefined ? Number(body.savedAmount)  : undefined,
    });
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, icon, targetAmount, savedAmount, targetDate, isCompleted } = parsed.data;

    const data: Record<string, unknown> = {};
    if (name         !== undefined) data.name         = name.slice(0, 50);
    if (icon         !== undefined) data.icon         = String(icon).slice(0, 10);
    if (targetAmount !== undefined) data.targetAmount = targetAmount;
    if (savedAmount  !== undefined) {
      const target = targetAmount ?? Number(existing.targetAmount);
      data.savedAmount = Math.max(0, Math.min(savedAmount, target));
    }
    if (targetDate   !== undefined) data.targetDate  = targetDate ? new Date(targetDate) : null;
    if (isCompleted  !== undefined) data.isCompleted = isCompleted;

    const goal = await prisma.goal.update({ where: { id }, data });
    return NextResponse.json(goal);
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const existing = await prisma.goal.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "없는 목표입니다." }, { status: 404 });
    }

    await prisma.goal.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
