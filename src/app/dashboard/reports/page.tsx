"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CategoryDonut } from "@/components/charts/CategoryDonut";
import { MonthlyBar } from "@/components/charts/MonthlyBar";
import { ChevronLeft, ChevronRight, TrendingDown, TrendingUp, Wallet, Lightbulb, CalendarDays, BarChart3, Sparkles, Upload } from "lucide-react";
import { formatKRW } from "@/lib/utils";
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip, Cell } from "recharts";
import { tooltipContentStyle, tooltipCursor } from "@/components/charts/ChartTooltip";
import { Skeleton } from "@/components/ui/skeleton";

interface CategoryData {
  name: string; icon: string; color: string; amount: number;
  prevAmount: number; diff: number | null;
}
interface MonthlyData { month: string; income: number; expense: number; }
interface MerchantData { name: string; amount: number; count: number; }
interface DowData { day: string; amount: number; }
interface WeeklyData { week: string; amount: number; }

interface ReportData {
  income: number; expense: number;
  prevIncome: number; prevExpense: number;
  incomeChange: number | null; expenseChange: number | null;
  savingsRate: number | null;
  categoryData: CategoryData[];
  monthlyData: MonthlyData[];
  topMerchants: MerchantData[];
  weeklyData: WeeklyData[];
  dowData: DowData[];
  dailyAvg: number;
  insights: string[];
}

function ChangeBadge({ value }: { value: number | null }) {
  if (value === null) return null;
  const up = value > 0;
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${up ? "bg-red-500/15 text-red-400" : "bg-emerald-500/15 text-emerald-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(value)}%
    </span>
  );
}

export default function ReportsPage() {
  const now = new Date();
  const [year, setYear]   = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData]   = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(true);

  const [aiInsights, setAiInsights]   = useState<string[] | null>(null);
  const [aiLoading, setAiLoading]     = useState(false);
  const [aiCached, setAiCached]       = useState(false);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    setAiInsights(null);
    const res = await fetch(`/api/reports?year=${year}&month=${month}`);
    setData(await res.json());
    setLoading(false);
  }, [year, month]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function prevMonth() {
    if (month === 1) { setYear(y => y - 1); setMonth(12); }
    else setMonth(m => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear(y => y + 1); setMonth(1); }
    else setMonth(m => m + 1);
  }

  async function handleAiInsights() {
    setAiLoading(true);
    try {
      const res  = await fetch("/api/ai/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ year, month }),
      });
      const json = await res.json();
      if (res.ok) {
        setAiInsights(json.insights);
        setAiCached(json.cached);
      }
    } finally {
      setAiLoading(false);
    }
  }

  const hasData = (data?.income ?? 0) > 0 || (data?.expense ?? 0) > 0;

  return (
    <div className="p-6 md:p-8 max-w-5xl mx-auto space-y-6">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">리포트</h1>
          <p className="text-sm text-muted-foreground mt-0.5">{year}년 {month}월 소비 분석</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors"><ChevronLeft size={16} /></button>
          <span className="text-sm font-semibold w-20 text-center">{year}년 {month}월</span>
          <button onClick={nextMonth} className="p-1.5 rounded-md hover:bg-accent transition-colors"><ChevronRight size={16} /></button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2">
                <Skeleton className="h-3 w-16" />
                <Skeleton className="h-7 w-24" />
                <Skeleton className="h-4 w-12" />
              </div>
            ))}
          </div>
          <div className="rounded-xl border border-border bg-card p-5 space-y-3">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-48 w-full" />
          </div>
        </div>
      ) : !hasData ? (
        <div className="py-20 text-center space-y-3">
          <p className="text-4xl">📊</p>
          <p className="text-sm text-muted-foreground">이 달의 거래 내역이 없어요</p>
          <Link href="/upload">
            <Button size="sm" className="mt-1 gap-1.5"><Upload size={13} /> 파일 업로드</Button>
          </Link>
        </div>
      ) : (
        <>
          {/* ── 1. 핵심 지표 ── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                  <TrendingUp size={12} className="text-emerald-400" /> 수입
                </div>
                <p className="text-lg font-bold text-emerald-400 tabular-nums">{formatKRW(data!.income)}</p>
                <div className="mt-1"><ChangeBadge value={data!.incomeChange} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                  <TrendingDown size={12} className="text-destructive" /> 지출
                </div>
                <p className="text-lg font-bold text-destructive tabular-nums">{formatKRW(data!.expense)}</p>
                <div className="mt-1"><ChangeBadge value={data!.expenseChange} /></div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                  <Wallet size={12} className="text-primary" /> 순 잔액
                </div>
                <p className={`text-lg font-bold tabular-nums ${(data!.income - data!.expense) >= 0 ? "text-primary" : "text-destructive"}`}>
                  {(data!.income - data!.expense).toLocaleString()}원
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center gap-1 text-xs text-muted-foreground mb-1.5">
                  <BarChart3 size={12} className="text-amber-400" /> 저축률
                </div>
                <p className={`text-lg font-bold tabular-nums ${(data!.savingsRate ?? 0) >= 0 ? "text-amber-400" : "text-destructive"}`}>
                  {data!.savingsRate !== null ? `${data!.savingsRate}%` : "-"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">하루 평균 {formatKRW(data!.dailyAvg)}</p>
              </CardContent>
            </Card>
          </div>

          {/* ── 2. 인사이트 (규칙 기반 + AI) ── */}
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-2 pt-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Lightbulb size={14} className="text-amber-400" /> 이달의 인사이트
                </CardTitle>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-7 text-xs gap-1.5"
                  onClick={handleAiInsights}
                  disabled={aiLoading}
                >
                  <Sparkles size={12} className="text-violet-400" />
                  {aiLoading ? "분석 중..." : aiInsights ? "재생성" : "AI 분석"}
                  {aiCached && !aiLoading && <span className="text-muted-foreground ml-1">캐시</span>}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-4">
              {aiLoading ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-4 w-full" />)}
                </div>
              ) : (
                <ul className="space-y-2">
                  {(aiInsights ?? data!.insights).map((insight, i) => (
                    <li key={i} className="text-sm text-foreground/80 flex items-start gap-2">
                      <span className="text-muted-foreground mt-0.5">•</span>
                      {insight}
                    </li>
                  ))}
                  {aiInsights && (
                    <li className="text-xs text-muted-foreground pt-1 flex items-center gap-1">
                      <Sparkles size={10} className="text-violet-400" /> Claude AI 생성
                    </li>
                  )}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ── 3. 카테고리 분석 + 전월 비교 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">카테고리별 지출</CardTitle>
              </CardHeader>
              <CardContent>
                <CategoryDonut data={data!.categoryData} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">전월 대비 변화</CardTitle>
              </CardHeader>
              <CardContent>
                {data!.categoryData.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
                ) : (
                  <ul className="space-y-2.5">
                    {data!.categoryData.slice(0, 7).map((cat) => {
                      const pct = data!.expense > 0 ? (cat.amount / data!.expense) * 100 : 0;
                      return (
                        <li key={cat.name}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-foreground">{cat.icon} {cat.name}</span>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground tabular-nums">{formatKRW(cat.amount)}</span>
                              {cat.diff !== null && (
                                <span className={`text-xs font-medium ${cat.diff > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                  {cat.diff > 0 ? "▲" : "▼"}{Math.abs(cat.diff)}%
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
                            <div className="h-1.5 rounded-full transition-all" style={{ width: `${Math.min(pct, 100)}%`, background: cat.color }} />
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 4. 요일별 + 주차별 ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CalendarDays size={15} /> 요일별 지출 패턴
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={data!.dowData} barCategoryGap="25%">
                    <XAxis dataKey="day" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                    <YAxis hide />
                    <Tooltip
                      formatter={(v) => [`${Number(v).toLocaleString()}원`, "지출"]}
                      contentStyle={tooltipContentStyle}
                      cursor={tooltipCursor}
                    />
                    <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                      {data!.dowData.map((entry: DowData, i: number) => {
                        const max = Math.max(...data!.dowData.map((d: DowData) => d.amount));
                        return <Cell key={i} fill={entry.amount === max ? "hsl(var(--primary))" : "hsl(var(--muted))"} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base font-semibold">주차별 지출</CardTitle>
              </CardHeader>
              <CardContent>
                {data!.weeklyData.length === 0 ? (
                  <div className="h-40 flex items-center justify-center text-sm text-muted-foreground">데이터 없음</div>
                ) : (
                  <ResponsiveContainer width="100%" height={180}>
                    <BarChart data={data!.weeklyData} barCategoryGap="30%">
                      <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                      <YAxis hide />
                      <Tooltip
                        formatter={(v) => [`${Number(v).toLocaleString()}원`, "지출"]}
                        contentStyle={{ background: "hsl(var(--popover))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px", color: "hsl(var(--popover-foreground))" }}
                      />
                      <Bar dataKey="amount" fill="#F87171" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* ── 5. 상위 지출처 TOP 10 ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">상위 지출처 TOP 10</CardTitle>
            </CardHeader>
            <CardContent>
              {data!.topMerchants.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 text-center">데이터 없음</p>
              ) : (
                <ul className="divide-y divide-border">
                  {data!.topMerchants.map((m, i) => {
                    const pct = data!.expense > 0 ? Math.round((m.amount / data!.expense) * 100) : 0;
                    return (
                      <li key={m.name} className="flex items-center gap-3 py-2.5">
                        <span className="text-xs text-muted-foreground w-5 text-right">{i + 1}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-sm font-medium truncate">{m.name}</span>
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                              <span className="text-xs text-muted-foreground">{m.count}회</span>
                              <span className="text-sm font-semibold tabular-nums text-foreground">{formatKRW(m.amount)}</span>
                              <span className="text-xs text-muted-foreground w-8 text-right">{pct}%</span>
                            </div>
                          </div>
                          <div className="w-full bg-muted rounded-full h-1 overflow-hidden">
                            <div className="h-1 rounded-full bg-primary/60" style={{ width: `${Math.min(pct * 3, 100)}%` }} />
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </CardContent>
          </Card>

          {/* ── 6. 월별 트렌드 ── */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">최근 6개월 수입 / 지출 트렌드</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyBar data={data!.monthlyData} />
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
