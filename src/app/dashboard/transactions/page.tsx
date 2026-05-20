import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";
import { Button } from "@/components/ui/button";

function formatKRW(amount: number) {
  return amount.toLocaleString() + "원";
}

export default async function TransactionsPage() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const transactions = await prisma.transaction.findMany({
    where: { userId: session.user.id },
    orderBy: { date: "desc" },
    take: 50,
    include: { category: true },
  });

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">거래 내역</h1>
        <p className="text-sm text-muted-foreground mt-0.5">최근 50건</p>
      </div>

      <Card>
        <CardContent className="p-0">
          {transactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-4xl">📂</p>
              <p className="text-sm text-muted-foreground">거래 내역이 없어요. 파일을 업로드해보세요.</p>
              <Link href="/upload">
                <Button size="sm" className="mt-1">파일 업로드</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => (
                <li key={tx.id} className="flex items-center justify-between px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{tx.category?.icon ?? "💳"}</span>
                    <div>
                      <p className="text-sm font-medium text-foreground">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category?.name ?? "미분류"} · {new Date(tx.date).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums ${!tx.isIncome ? "text-destructive" : "text-emerald-400"}`}>
                    {!tx.isIncome ? "-" : "+"}{formatKRW(Number(tx.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
