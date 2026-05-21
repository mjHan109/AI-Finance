import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { log } from "@/lib/logger";

/**
 * DELETE /api/upload/history/[id]
 *
 * Deletes an UploadedFile record and all its associated transactions.
 * This effectively "rolls back" the import for that file.
 */
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "로그인이 필요합니다." }, { status: 401 });
  }
  const userId = session.user.id;

  try {
    const { id } = await params;

    const file = await prisma.uploadedFile.findUnique({ where: { id } });
    if (!file || file.userId !== userId) {
      return NextResponse.json({ error: "파일을 찾을 수 없습니다." }, { status: 404 });
    }

    // Delete transactions first (handles cases where DB cascade is not yet applied)
    const { count } = await prisma.transaction.deleteMany({
      where: { fileId: id, userId },
    });

    await prisma.uploadedFile.delete({ where: { id } });

    log("info", "file_delete", { userId, fileId: id, txDeleted: count });

    return NextResponse.json({ ok: true, deletedTransactions: count });
  } catch {
    log("error", "server_error", { route: "DELETE /api/upload/history/[id]" });
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
