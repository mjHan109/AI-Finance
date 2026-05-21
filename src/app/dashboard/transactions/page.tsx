"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Search, Upload } from "lucide-react";
import { formatKRW } from "@/lib/utils";
import { TransactionDetailModal } from "@/components/TransactionDetailModal";
import { Skeleton } from "@/components/ui/skeleton";

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
  category: Category | null;
}


export default function TransactionsPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [type, setType] = useState<"all" | "income" | "expense">("all");
  const [page, setPage] = useState(1);

  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [reclassifying, setReclassifying] = useState(false);
  const [selectedTxId, setSelectedTxId] = useState<string | null>(null);

  // 카테고리 목록 최초 1회 로드
  useEffect(() => {
    fetch("/api/categories")
      .then(r => r.json())
      .then(setCategories);
  }, []);

  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({
      year: String(year), month: String(month),
      search, categoryId, type, page: String(page),
    });
    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.transactions ?? []);
    setTotal(data.total ?? 0);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  }, [year, month, search, categoryId, type, page]);

  useEffect(() => { fetchTransactions(); }, [fetchTransactions]);

  function prevMonth() {
    setPage(1);
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    setPage(1);
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  function handleTypeChange(v: "all" | "income" | "expense") {
    setType(v);
    setPage(1);
  }

  function handleCategoryChange(id: string) {
    setCategoryId(id);
    setPage(1);
  }

  async function handleReclassify() {
    setReclassifying(true);
    await fetch("/api/reclassify", { method: "POST" });
    setReclassifying(false);
    fetchTransactions();
  }

  return (
    <div className="p-6 md:p-8 max-w-4xl mx-auto space-y-5">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">거래 내역</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {loading ? "불러오는 중..." : `총 ${total.toLocaleString()}건`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline" size="sm" className="text-xs h-8 gap-1"
            onClick={handleReclassify} disabled={reclassifying}
          >
            {reclassifying ? "분류 중..." : "🔄 재분류"}
          </Button>
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold w-20 text-center">{year}년 {month}월</span>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 필터 영역 */}
      <div className="space-y-2.5">
        {/* 검색 */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <Input
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="거래 내역 검색..."
            className="h-9 text-sm"
          />
          <Button type="submit" size="sm" variant="secondary" className="h-9 px-3">
            <Search size={14} />
          </Button>
        </form>

        {/* 수입/지출 탭 */}
        <div className="flex gap-1.5">
          {(["all", "income", "expense"] as const).map((t) => (
            <button
              key={t}
              onClick={() => handleTypeChange(t)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                type === t
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {t === "all" ? "전체" : t === "income" ? "수입" : "지출"}
            </button>
          ))}
        </div>

        {/* 카테고리 필터 */}
        <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide"
          style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => handleCategoryChange("")}
            className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              categoryId === ""
                ? "bg-secondary text-secondary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            전체
          </button>
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryChange(cat.id)}
              className={`shrink-0 px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                categoryId === cat.id
                  ? "bg-secondary text-secondary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-accent"
              }`}
            >
              {cat.icon} {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* 거래 목록 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-5 py-3.5">
                  <Skeleton className="h-8 w-8 rounded-full shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-44" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <p className="text-4xl">📂</p>
              <p className="text-sm text-muted-foreground">거래 내역이 없어요</p>
              <Link href="/upload">
                <Button size="sm" className="mt-1 gap-1.5"><Upload size={13} /> 파일 업로드</Button>
              </Link>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {transactions.map((tx) => (
                <li
                  key={tx.id}
                  onClick={() => setSelectedTxId(tx.id)}
                  className="flex items-center justify-between px-5 py-3.5 cursor-pointer hover:bg-accent/40 transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="text-xl shrink-0">{tx.category?.icon ?? "💳"}</span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{tx.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {tx.category?.name ?? "미분류"} · {new Date(tx.date).toLocaleDateString("ko-KR")}
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm font-semibold tabular-nums shrink-0 ml-4 ${!tx.isIncome ? "text-destructive" : "text-emerald-400"}`}>
                    {!tx.isIncome ? "-" : "+"}{formatKRW(Number(tx.amount))}
                  </p>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <TransactionDetailModal
        txId={selectedTxId}
        categories={categories}
        onClose={() => setSelectedTxId(null)}
        onUpdated={fetchTransactions}
      />

      {/* 페이지네이션 */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button
            variant="ghost" size="sm"
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            <ChevronLeft size={14} /> 이전
          </Button>
          <span className="text-sm text-muted-foreground">
            {page} / {totalPages}
          </span>
          <Button
            variant="ghost" size="sm"
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            다음 <ChevronRight size={14} />
          </Button>
        </div>
      )}
    </div>
  );
}
