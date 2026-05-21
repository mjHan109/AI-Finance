import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  const tx = await prisma.transaction.findUnique({
    where: { id },
    include: { category: true, financialAccount: true },
  });

  if (!tx || tx.userId !== session.user.id) {
    return NextResponse.json({ error: "없는 거래입니다." }, { status: 404 });
  }

  return NextResponse.json(tx);
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const { id } = await params;

  const existing = await prisma.transaction.findUnique({ where: { id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "없는 거래입니다." }, { status: 404 });
  }

  const body = await req.json();
  const data: Record<string, unknown> = {};

  if (body.memo !== undefined) data.memo = body.memo ?? null;
  if (body.isExcluded !== undefined) data.isExcluded = Boolean(body.isExcluded);
  if (body.categoryId !== undefined) {
    data.categoryId = body.categoryId ?? null;
    data.classifiedBy = "USER";
  }

  const updated = await prisma.transaction.update({
    where: { id },
    data,
    include: { category: true },
  });

  return NextResponse.json(updated);
}
