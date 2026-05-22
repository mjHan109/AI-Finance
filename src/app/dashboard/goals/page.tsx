"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Plus, Trash2, Check, Pencil, Trophy,
  Calendar, ChevronLeft, ChevronRight,
} from "lucide-react";
import { formatKRW } from "@/lib/utils";

interface Goal {
  id: string;
  name: string;
  icon: string;
  targetAmount: string;
  savedAmount: string;
  targetDate: string | null;
  isCompleted: boolean;
}

const ICON_OPTIONS = ["🎯", "🏠", "💍", "✈️", "🚗", "📚", "💊", "🐶", "💻", "🌏"];

// ─── Calendar Picker ──────────────────────────────────────────────────────────

const KO_DAYS  = ["일","월","화","수","목","금","토"];
const KO_MONTHS = ["1월","2월","3월","4월","5월","6월","7월","8월","9월","10월","11월","12월"];

function toDateStr(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2,"0")}-${String(d).padStart(2,"0")}`;
}

function CalendarPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const init = value ? new Date(value + "T00:00:00") : today;
  const [viewYear,  setViewYear]  = useState(init.getFullYear());
  const [viewMonth, setViewMonth] = useState(init.getMonth());
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  function prevMonth() {
    if (viewMonth === 0) { setViewMonth(11); setViewYear(y => y - 1); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewMonth(0); setViewYear(y => y + 1); }
    else setViewMonth(m => m + 1);
  }

  function selectDay(day: number) {
    const d = new Date(viewYear, viewMonth, day);
    if (d < today) return;
    onChange(toDateStr(viewYear, viewMonth, day));
    setOpen(false);
  }

  const selected = value ? new Date(value + "T00:00:00") : null;
  const firstDay   = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();

  const displayValue = selected
    ? selected.toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" })
    : "날짜 선택 (선택)";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className={`w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-left flex items-center gap-2 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/50 ${value ? "text-foreground" : "text-muted-foreground"}`}
      >
        <Calendar size={14} className="shrink-0 text-muted-foreground" />
        {displayValue}
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-72 bg-card border border-border rounded-xl shadow-2xl p-3 left-0">
          {/* 월 헤더 */}
          <div className="flex items-center justify-between mb-3">
            <button type="button" onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronLeft size={14} />
            </button>
            <span className="text-sm font-semibold tabular-nums">
              {viewYear}년 {KO_MONTHS[viewMonth]}
            </span>
            <button type="button" onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-accent transition-colors">
              <ChevronRight size={14} />
            </button>
          </div>

          {/* 요일 헤더 */}
          <div className="grid grid-cols-7 mb-1">
            {KO_DAYS.map(d => (
              <div key={d} className={`text-center text-[10px] font-medium py-1 ${d === "일" ? "text-red-400" : d === "토" ? "text-blue-400" : "text-muted-foreground"}`}>{d}</div>
            ))}
          </div>

          {/* 날짜 그리드 */}
          <div className="grid grid-cols-7 gap-0.5">
            {Array.from({ length: firstDay }).map((_, i) => <div key={`e-${i}`} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const d   = new Date(viewYear, viewMonth, day);
              d.setHours(0, 0, 0, 0);
              const isPast = d < today;
              const isSel  = selected &&
                selected.getFullYear() === viewYear &&
                selected.getMonth()    === viewMonth &&
                selected.getDate()     === day;
              const isToday = d.getTime() === today.getTime();
              const dow = d.getDay();
              return (
                <button
                  key={day}
                  type="button"
                  disabled={isPast}
                  onClick={() => selectDay(day)}
                  className={[
                    "aspect-square flex items-center justify-center text-xs rounded-lg transition-colors",
                    isPast ? "text-muted-foreground/25 cursor-not-allowed" : "cursor-pointer hover:bg-accent",
                    isSel  ? "!bg-primary !text-primary-foreground hover:!bg-primary" : "",
                    isToday && !isSel ? "border border-primary/60 text-primary font-semibold" : "",
                    !isPast && !isSel && dow === 0 ? "text-red-400" : "",
                    !isPast && !isSel && dow === 6 ? "text-blue-400" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {day}
                </button>
              );
            })}
          </div>

          {value && (
            <button
              type="button"
              onClick={() => { onChange(""); setOpen(false); }}
              className="mt-2 w-full text-[11px] text-muted-foreground hover:text-foreground text-center transition-colors"
            >
              날짜 지우기
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Goal Card ────────────────────────────────────────────────────────────────

function GoalCard({
  goal,
  onUpdate,
  onDelete,
}: {
  goal: Goal;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const target    = Number(goal.targetAmount);
  const saved     = Number(goal.savedAmount);
  const pct       = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const done      = goal.isCompleted || saved >= target;
  const remaining = Math.max(0, target - saved);

  const [editing,  setEditing]  = useState(false);
  const [addValue, setAddValue] = useState("");
  const [saving,   setSaving]   = useState(false);
  const [celebrate, setCelebrate] = useState(false);

  const prevPct = useRef(pct);
  useEffect(() => {
    if (!prevPct.current || prevPct.current < 100) {
      if (pct >= 100) {
        setCelebrate(true);
        const t = setTimeout(() => setCelebrate(false), 2500);
        return () => clearTimeout(t);
      }
    }
    prevPct.current = pct;
  }, [pct]);

  async function handleAdd() {
    const add = parseInt(addValue.replace(/,/g, "")) || 0;
    if (add <= 0) return;
    setSaving(true);
    await onUpdate(goal.id, { savedAmount: saved + add });
    setAddValue("");
    setSaving(false);
    setEditing(false);
  }

  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
    : null;

  const monthsLeft = daysLeft !== null && daysLeft > 0 ? Math.ceil(daysLeft / 30) : null;
  const monthlyRequired = monthsLeft && remaining > 0 ? Math.ceil(remaining / monthsLeft) : null;

  const dDayLabel = daysLeft === null ? null
    : daysLeft === 0 ? "D-Day"
    : daysLeft > 0   ? `D-${daysLeft}`
    : `${Math.abs(daysLeft)}일 지남`;

  const dDayColor = daysLeft === null ? ""
    : daysLeft < 0   ? "text-destructive"
    : daysLeft <= 7  ? "text-amber-400"
    : "text-muted-foreground";

  const barColor = done ? "bg-emerald-400"
    : pct >= 80 ? "bg-amber-400"
    : "bg-primary";

  return (
    <Card className={[
      "transition-all",
      done ? "opacity-80" : "",
      celebrate ? "ring-2 ring-emerald-400/50" : "",
    ].filter(Boolean).join(" ")}>
      <CardContent className="pt-4 pb-4">
        {/* 상단 */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className={`text-2xl shrink-0 ${celebrate ? "animate-bounce" : ""}`}>
              {done ? "🏆" : goal.icon}
            </span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {goal.name}
              </p>
              <div className="flex items-center gap-2 mt-0.5">
                {dDayLabel && !done && (
                  <span className={`text-xs font-medium ${dDayColor}`}>{dDayLabel}</span>
                )}
                {done && (
                  <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                    <Trophy size={11} /> 달성 완료
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1 shrink-0 mt-0.5">
            {!done && (
              <button
                onClick={() => setEditing(e => !e)}
                className="p-1.5 rounded-lg hover:bg-accent transition-colors"
              >
                <Pencil size={12} className="text-muted-foreground" />
              </button>
            )}
            <button
              onClick={() => onDelete(goal.id)}
              className="p-1.5 rounded-lg hover:bg-accent transition-colors"
            >
              <Trash2 size={12} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground tabular-nums">{formatKRW(saved)}</span>
            <span className={`font-bold tabular-nums ${done ? "text-emerald-400" : pct >= 80 ? "text-amber-400" : "text-primary"}`}>
              {Math.round(pct)}%
            </span>
            <span className="text-muted-foreground tabular-nums">{formatKRW(target)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${barColor}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* 월 필요 저축액 */}
        {!done && monthlyRequired && (
          <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
            달성까지 월 약 <span className="text-foreground font-medium">{formatKRW(monthlyRequired)}</span> 필요
            {monthsLeft && <span className="ml-1">({monthsLeft}개월 남음)</span>}
          </p>
        )}

        {/* 적립 입력 */}
        {editing && !done && (
          <div className="mt-3 flex gap-2">
            <Input
              value={addValue}
              onChange={e => setAddValue(e.target.value)}
              placeholder="추가 금액 입력"
              className="h-9 text-sm tabular-nums"
              type="number"
              min={1}
              autoFocus
              onKeyDown={e => {
                if (e.key === "Enter") handleAdd();
                if (e.key === "Escape") setEditing(false);
              }}
            />
            <Button size="sm" className="h-9 px-3 text-xs shrink-0" onClick={handleAdd} disabled={saving}>
              <Check size={12} className="mr-1" />추가
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Add Goal Form ─────────────────────────────────────────────────────────────

function AddGoalForm({ onAdded }: { onAdded: () => void }) {
  const [open,         setOpen]         = useState(false);
  const [name,         setName]         = useState("");
  const [icon,         setIcon]         = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate,   setTargetDate]   = useState("");
  const [saving,       setSaving]       = useState(false);
  const [errors,       setErrors]       = useState<{ name?: string; amount?: string; date?: string }>({});

  function validate() {
    const e: typeof errors = {};
    if (!name.trim())                                      e.name   = "목표 이름을 입력하세요";
    const amt = parseInt(targetAmount.replace(/,/g, ""));
    if (!targetAmount || isNaN(amt) || amt <= 0)           e.amount = "0보다 큰 금액을 입력하세요";
    if (targetDate) {
      const d = new Date(targetDate + "T00:00:00");
      const today = new Date(); today.setHours(0,0,0,0);
      if (d <= today)                                      e.date   = "오늘 이후 날짜를 선택하세요";
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  async function submit() {
    if (!validate()) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: name.trim(),
        icon,
        targetAmount: parseInt(targetAmount.replace(/,/g, "")),
        targetDate: targetDate || null,
      }),
    });
    setName(""); setTargetAmount(""); setTargetDate(""); setIcon("🎯"); setErrors({});
    setSaving(false);
    setOpen(false);
    onAdded();
  }

  function reset() {
    setOpen(false);
    setName(""); setTargetAmount(""); setTargetDate(""); setIcon("🎯"); setErrors({});
  }

  if (!open) {
    return (
      <Button variant="outline" className="w-full gap-2" onClick={() => setOpen(true)}>
        <Plus size={14} /> 새 목표 추가
      </Button>
    );
  }

  return (
    <Card>
      <CardContent className="pt-4 pb-5 space-y-4">
        <p className="text-sm font-semibold text-foreground">새 목표</p>

        {/* 아이콘 선택 */}
        <div>
          <p className="text-xs text-muted-foreground mb-2">아이콘</p>
          <div className="flex gap-1.5 flex-wrap">
            {ICON_OPTIONS.map(ic => (
              <button
                key={ic}
                type="button"
                onClick={() => setIcon(ic)}
                className={`w-9 h-9 flex items-center justify-center text-lg rounded-lg transition-all ${
                  icon === ic
                    ? "bg-primary/20 ring-2 ring-primary scale-110"
                    : "hover:bg-accent"
                }`}
              >
                {ic}
              </button>
            ))}
          </div>
        </div>

        {/* 목표 이름 */}
        <div>
          <Input
            value={name}
            onChange={e => { setName(e.target.value); setErrors(v => ({ ...v, name: undefined })); }}
            placeholder="목표 이름 (예: 결혼 자금)"
            className={`h-9 text-sm ${errors.name ? "border-destructive focus:ring-destructive/50" : ""}`}
            maxLength={50}
          />
          {errors.name && <p className="text-xs text-destructive mt-1">{errors.name}</p>}
        </div>

        {/* 목표 금액 */}
        <div>
          <Input
            value={targetAmount}
            onChange={e => { setTargetAmount(e.target.value); setErrors(v => ({ ...v, amount: undefined })); }}
            placeholder="목표 금액 (원)"
            className={`h-9 text-sm tabular-nums ${errors.amount ? "border-destructive focus:ring-destructive/50" : ""}`}
            type="number"
            min={1}
          />
          {errors.amount && <p className="text-xs text-destructive mt-1">{errors.amount}</p>}
        </div>

        {/* 목표일 */}
        <div>
          <label className="text-xs text-muted-foreground mb-1.5 block">목표일</label>
          <CalendarPicker
            value={targetDate}
            onChange={v => { setTargetDate(v); setErrors(e => ({ ...e, date: undefined })); }}
          />
          {errors.date && <p className="text-xs text-destructive mt-1">{errors.date}</p>}
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" className="flex-1" onClick={reset}>취소</Button>
          <Button size="sm" className="flex-1" onClick={submit} disabled={saving}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// ─── Page ──────────────────────────────────────────────────────────────────────

export default function GoalsPage() {
  const [goals,   setGoals]   = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const res  = await fetch("/api/goals");
    const data = await res.json();
    setGoals(Array.isArray(data) ? data : []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchGoals(); }, [fetchGoals]);

  async function handleUpdate(id: string, data: Record<string, unknown>) {
    await fetch(`/api/goals/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    fetchGoals();
  }

  async function handleDelete(id: string) {
    await fetch(`/api/goals/${id}`, { method: "DELETE" });
    fetchGoals();
  }

  const active    = goals.filter(g => !g.isCompleted && Number(g.savedAmount) < Number(g.targetAmount));
  const completed = goals.filter(g => g.isCompleted  || Number(g.savedAmount) >= Number(g.targetAmount));

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">목표</h1>
        <p className="text-sm text-muted-foreground mt-0.5">저축 목표를 설정하고 진행 상황을 관리하세요</p>
      </div>

      <AddGoalForm onAdded={fetchGoals} />

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <Skeleton className="h-4 w-32" />
              </div>
              <Skeleton className="h-2.5 w-full rounded-full" />
              <Skeleton className="h-3 w-24" />
            </div>
          ))}
        </div>
      ) : goals.length === 0 ? (
        <div className="py-16 text-center space-y-3">
          <p className="text-4xl">🎯</p>
          <p className="text-sm text-muted-foreground">아직 목표가 없어요. 첫 번째 목표를 추가해보세요!</p>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                진행 중 ({active.length})
              </p>
              {active.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                달성 완료 ({completed.length})
              </p>
              {completed.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
