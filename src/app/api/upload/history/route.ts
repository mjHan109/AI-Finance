import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }

  try {
    const files = await prisma.uploadedFile.findMany({
      where: { userId: session.user.id },
      orderBy: { parsedAt: "desc" },
      take: 20,
      include: { _count: { select: { transactions: true } } },
    });
    return NextResponse.json(files);
  } catch {
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
