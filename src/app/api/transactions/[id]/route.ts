import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { txPatchSchema, safeParse } from "@/lib/schemas";
import { encrypt, decrypt } from "@/lib/encryption";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const { id } = await params;

    const tx = await prisma.transaction.findUnique({
      where: { id },
      include: { category: true, financialAccount: true },
    });

    if (!tx || tx.userId !== session.user.id) {
      return NextResponse.json({ error: "없는 거래입니다." }, { status: 404 });
    }

    return NextResponse.json({ ...tx, memo: decrypt(tx.memo) });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}

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

    const existing = await prisma.transaction.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "없는 거래입니다." }, { status: 404 });
    }

    const body   = await req.json();
    const parsed = safeParse(txPatchSchema, body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { memo, isExcluded, categoryId } = parsed.data;

    const data: Record<string, unknown> = {};

    if (memo !== undefined) {
      data.memo = memo === null ? null : encrypt(memo.trim().slice(0, 200).replace(/[<>"'`]/g, ""));
    }
    if (isExcluded !== undefined) {
      data.isExcluded = isExcluded;
    }
    if (categoryId !== undefined) {
      data.categoryId   = categoryId ?? null;
      data.classifiedBy = "USER";

      // Save UserCorrection so reclassify respects this choice going forward
      if (categoryId !== null) {
        await prisma.userCorrection.upsert({
          where: { userId_pattern: { userId: session.user.id, pattern: existing.description.toLowerCase() } },
          update: { categoryId },
          create: { userId: session.user.id, pattern: existing.description.toLowerCase(), categoryId },
        });
      }
    }

    const updated = await prisma.transaction.update({
      where: { id },
      data,
      include: { category: true },
    });

    return NextResponse.json({ ...updated, memo: decrypt(updated.memo) });
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
