"use client";

import { useState } from "react";
import { formatKRW } from "@/lib/utils";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Transaction {
  id: string;
  date: Date | string;
  description: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  amount: any;
  isIncome: boolean;
  category: Category | null;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
}

export function RecentTransactions({ transactions, categories }: Props) {
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  return (
    <>
      <ul className="divide-y divide-border">
        {transactions.map((tx) => (
          <li
            key={tx.id}
            onClick={() => setSelectedTxId(tx.id)}
            className="flex items-center justify-between py-3 cursor-pointer hover:bg-accent/40 -mx-1 px-1 rounded-lg transition-colors"
          >
            <div className="flex items-center gap-3">
              <span className="text-lg">{tx.category?.icon ?? "💳"}</span>
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

      <TransactionDetailModal
        txId={selectedTxId}
        categories={categories}
        onClose={() => setSelectedTxId(null)}
        onUpdated={() => {}}
      />
    </>
  );
}
