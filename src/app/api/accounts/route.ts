import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const accounts = await prisma.financialAccount.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { transactions: true } },
    },
  })

  return NextResponse.json(accounts)
}

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { name, type, color } = await req.json()

  if (!name || !type) {
    return NextResponse.json({ error: "이름과 종류는 필수입니다." }, { status: 400 })
  }

  const validTypes = ["BANK", "CARD", "CASH"]
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: "올바르지 않은 계좌 종류입니다." }, { status: 400 })
  }

  try {
    const account = await prisma.financialAccount.create({
      data: {
        userId: session.user.id,
        name,
        type,
        color: color ?? null,
      },
    })
    return NextResponse.json(account, { status: 201 })
  } catch {
    return NextResponse.json({ error: "이미 같은 이름의 계좌가 있습니다." }, { status: 409 })
  }
}

export async function DELETE(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 })
  }

  const { id } = await req.json()
  if (!id) return NextResponse.json({ error: "id가 필요합니다." }, { status: 400 })

  await prisma.financialAccount.deleteMany({
    where: { id, userId: session.user.id },
  })

  return NextResponse.json({ ok: true })
}
