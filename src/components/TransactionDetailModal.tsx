"use client";

import { useEffect, useRef, useState } from "react";
import { X, Check, EyeOff, Eye } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface Category {
  id: string;
  name: string;
  icon: string | null;
  color: string | null;
}

interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: string;
  isIncome: boolean;
  memo: string | null;
  isExcluded: boolean;
  classifiedBy: string;
  category: Category | null;
  financialAccount: { name: string } | null;
}

interface Props {
  txId: string | null;
  categories: Category[];
  onClose: () => void;
  onUpdated: () => void;
}

export function TransactionDetailModal({ txId, categories, onClose, onUpdated }: Props) {
  const [tx, setTx] = useState<Transaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [memo, setMemo] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [saving, setSaving] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!txId) { setTx(null); return; }
    setLoading(true);
    fetch(`/api/transactions/${txId}`)
      .then((r) => r.json())
      .then((data: Transaction) => {
        setTx(data);
        setMemo(data.memo ?? "");
        setCategoryId(data.category?.id ?? "");
        setLoading(false);
      });
  }, [txId]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  if (!txId) return null;

  async function save() {
    if (!tx) return;
    setSaving(true);
    await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo: memo || null, categoryId: categoryId || null }),
    });
    setSaving(false);
    onUpdated();
    onClose();
  }

  async function toggleExclude() {
    if (!tx) return;
    setSaving(true);
    await fetch(`/api/transactions/${tx.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isExcluded: !tx.isExcluded }),
    });
    setSaving(false);
    onUpdated();
    onClose();
  }

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm"
      onClick={(e) => { if (e.target === overlayRef.current) onClose(); }}
    >
      <div className="w-full sm:max-w-md bg-card border border-border rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden">
        {/* 헤더 */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-base font-semibold text-foreground">거래 상세</h2>
          <button onClick={onClose} className="p-1 rounded-md hover:bg-accent transition-colors">
            <X size={16} />
          </button>
        </div>

        {loading || !tx ? (
          <div className="py-16 text-center text-sm text-muted-foreground">불러오는 중...</div>
        ) : (
          <div className="px-5 py-4 space-y-4">
            {/* 금액 + 설명 */}
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {new Date(tx.date).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}
                  {tx.financialAccount && ` · ${tx.financialAccount.name}`}
                </p>
                <p className="text-base font-semibold text-foreground mt-0.5">{tx.description}</p>
              </div>
              <p className={`text-lg font-bold tabular-nums shrink-0 ml-4 ${!tx.isIncome ? "text-destructive" : "text-emerald-400"}`}>
                {!tx.isIncome ? "-" : "+"}{formatKRW(Number(tx.amount))}
              </p>
            </div>

            {/* 카테고리 선택 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">카테고리</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">미분류</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </option>
                ))}
              </select>
              {tx.classifiedBy === "USER" && (
                <p className="text-xs text-primary mt-1">직접 분류됨</p>
              )}
            </div>

            {/* 메모 */}
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">메모</label>
              <input
                type="text"
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="메모를 입력하세요"
                maxLength={200}
                className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* 액션 버튼 */}
            <div className="flex gap-2 pt-1">
              <button
                onClick={toggleExclude}
                disabled={saving}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium border transition-colors ${
                  tx.isExcluded
                    ? "border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/10"
                    : "border-border text-muted-foreground hover:bg-accent"
                }`}
              >
                {tx.isExcluded ? <Eye size={13} /> : <EyeOff size={13} />}
                {tx.isExcluded ? "집계에 포함" : "집계에서 제외"}
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="ml-auto flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              >
                <Check size={13} />
                {saving ? "저장 중..." : "저장"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
