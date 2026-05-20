"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Check, Pencil } from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface BudgetItem {
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  budget: number;
  spent: number;
}


export default function BudgetPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [items, setItems] = useState<BudgetItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchBudgets = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/budgets?year=${year}&month=${month}`);
    const data = await res.json();
    setItems(data.items ?? []);
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchBudgets(); }, [fetchBudgets]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  function startEdit(item: BudgetItem) {
    setEditingId(item.categoryId);
    setEditValue(item.budget > 0 ? String(item.budget) : "");
  }

  async function saveBudget(categoryId: string) {
    const amount = parseInt(editValue.replace(/,/g, "")) || 0;
    setSaving(true);
    await fetch("/api/budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, year, month, amount }),
    });
    setSaving(false);
    setEditingId(null);
    fetchBudgets();
  }

  const activeItems = items.filter(i => i.budget > 0 || i.spent > 0);
  const inactiveItems = items.filter(i => i.budget === 0 && i.spent === 0);
  const totalBudget = items.reduce((s, i) => s + i.budget, 0);
  const totalSpent = items.reduce((s, i) => s + i.spent, 0);

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">예산</h1>
          <p className="text-sm text-muted-foreground mt-0.5">카테고리별 예산을 설정하고 지출을 관리하세요</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm font-semibold w-20 text-center">{year}년 {month}월</span>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* 전체 요약 */}
      {totalBudget > 0 && (
        <Card>
          <CardContent className="pt-5 pb-5">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">전체 예산 사용률</span>
              <span className="font-semibold tabular-nums">
                {formatKRW(totalSpent)} / {formatKRW(totalBudget)}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  totalSpent / totalBudget > 1 ? "bg-destructive" :
                  totalSpent / totalBudget > 0.8 ? "bg-amber-400" : "bg-primary"
                }`}
                style={{ width: `${Math.min((totalSpent / totalBudget) * 100, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1.5 text-right">
              {Math.round((totalSpent / totalBudget) * 100)}% 사용
            </p>
          </CardContent>
        </Card>
      )}

      {/* 활성 카테고리 */}
      {loading ? (
        <div className="py-16 text-center text-muted-foreground text-sm">불러오는 중...</div>
      ) : (
        <>
          {activeItems.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">설정된 예산</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {activeItems.map((item) => {
                  const pct = item.budget > 0 ? Math.min((item.spent / item.budget) * 100, 100) : 0;
                  const over = item.budget > 0 && item.spent > item.budget;
                  const warn = !over && item.budget > 0 && item.spent / item.budget > 0.8;
                  const isEditing = editingId === item.categoryId;

                  return (
                    <div key={item.categoryId} className="space-y-1.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-base">{item.categoryIcon}</span>
                          <span className="text-sm font-medium truncate">{item.categoryName}</span>
                          {over && <span className="text-xs text-destructive font-medium">초과</span>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {isEditing ? (
                            <>
                              <Input
                                value={editValue}
                                onChange={e => setEditValue(e.target.value)}
                                className="h-7 w-28 text-xs text-right tabular-nums"
                                placeholder="예산 금액"
                                autoFocus
                                onKeyDown={e => { if (e.key === "Enter") saveBudget(item.categoryId); if (e.key === "Escape") setEditingId(null); }}
                              />
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveBudget(item.categoryId)} disabled={saving}>
                                <Check size={13} />
                              </Button>
                            </>
                          ) : (
                            <>
                              <span className={`text-xs tabular-nums ${over ? "text-destructive" : "text-muted-foreground"}`}>
                                {formatKRW(item.spent)} / {item.budget > 0 ? formatKRW(item.budget) : "미설정"}
                              </span>
                              <button onClick={() => startEdit(item)} className="p-1 rounded hover:bg-accent transition-colors">
                                <Pencil size={12} className="text-muted-foreground" />
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                      {item.budget > 0 && (
                        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                          <div
                            className={`h-1.5 rounded-full transition-all ${over ? "bg-destructive" : warn ? "bg-amber-400" : "bg-primary"}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          )}

          {/* 미설정 카테고리 */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">
                {activeItems.length > 0 ? "예산 추가하기" : "카테고리별 예산 설정"}
              </CardTitle>
            </CardHeader>
            <CardContent className="divide-y divide-border">
              {inactiveItems.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">모든 카테고리에 예산이 설정됐어요 🎉</p>
              ) : (
                inactiveItems.map((item) => {
                  const isEditing = editingId === item.categoryId;
                  return (
                    <div key={item.categoryId} className="flex items-center justify-between py-3 gap-2">
                      <div className="flex items-center gap-2">
                        <span className="text-base">{item.categoryIcon}</span>
                        <span className="text-sm text-muted-foreground">{item.categoryName}</span>
                      </div>
                      {isEditing ? (
                        <div className="flex items-center gap-2">
                          <Input
                            value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            className="h-7 w-28 text-xs text-right tabular-nums"
                            placeholder="예산 금액 (원)"
                            autoFocus
                            onKeyDown={e => { if (e.key === "Enter") saveBudget(item.categoryId); if (e.key === "Escape") setEditingId(null); }}
                          />
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => saveBudget(item.categoryId)} disabled={saving}>
                            <Check size={13} />
                          </Button>
                        </div>
                      ) : (
                        <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => startEdit(item)}>
                          + 설정
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
