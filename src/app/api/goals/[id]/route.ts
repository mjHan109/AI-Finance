import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "없는 목표입니다." }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.name !== undefined)         data.name = String(body.name).trim().slice(0, 50);
  if (body.icon !== undefined)         data.icon = String(body.icon).slice(0, 10);
  if (body.targetAmount !== undefined) data.targetAmount = Number(body.targetAmount);
  if (body.savedAmount !== undefined)  data.savedAmount = Math.max(0, Number(body.savedAmount));
  if (body.targetDate !== undefined)   data.targetDate = body.targetDate ? new Date(body.targetDate) : null;
  if (body.isCompleted !== undefined)  data.isCompleted = Boolean(body.isCompleted);

  const goal = await prisma.goal.update({ where: { id }, data });
  return NextResponse.json(goal);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.goal.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "없는 목표입니다." }, { status: 404 });
  }

  await prisma.goal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
