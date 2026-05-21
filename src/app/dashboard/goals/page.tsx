"use client";

import { useEffect, useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Check, Pencil, Trophy } from "lucide-react";
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

function GoalCard({ goal, onUpdate, onDelete }: {
  goal: Goal;
  onUpdate: (id: string, data: Record<string, unknown>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}) {
  const target = Number(goal.targetAmount);
  const saved  = Number(goal.savedAmount);
  const pct    = target > 0 ? Math.min((saved / target) * 100, 100) : 0;
  const done   = goal.isCompleted || saved >= target;

  const [editing, setEditing] = useState(false);
  const [addValue, setAddValue] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    const add = parseInt(addValue.replace(/,/g, "")) || 0;
    if (add <= 0) return;
    setSaving(true);
    await onUpdate(goal.id, { savedAmount: saved + add });
    setAddValue("");
    setSaving(false);
    setEditing(false);
  }

  async function toggleComplete() {
    await onUpdate(goal.id, { isCompleted: !goal.isCompleted });
  }

  const daysLeft = goal.targetDate
    ? Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <Card className={done ? "opacity-75" : ""}>
      <CardContent className="pt-4 pb-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-2xl shrink-0">{goal.icon}</span>
            <div className="min-w-0">
              <p className={`text-sm font-semibold truncate ${done ? "line-through text-muted-foreground" : "text-foreground"}`}>
                {goal.name}
              </p>
              {daysLeft !== null && !done && (
                <p className={`text-xs ${daysLeft < 0 ? "text-destructive" : "text-muted-foreground"}`}>
                  {daysLeft < 0 ? `${Math.abs(daysLeft)}일 지남` : `D-${daysLeft}`}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {done ? (
              <span className="text-xs font-medium text-emerald-400 flex items-center gap-1">
                <Trophy size={12} /> 달성
              </span>
            ) : (
              <button onClick={() => setEditing(e => !e)} className="p-1 rounded hover:bg-accent transition-colors">
                <Pencil size={12} className="text-muted-foreground" />
              </button>
            )}
            <button onClick={() => onDelete(goal.id)} className="p-1 rounded hover:bg-accent transition-colors">
              <Trash2 size={12} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* 진행 바 */}
        <div className="mt-3 space-y-1.5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-muted-foreground tabular-nums">{formatKRW(saved)}</span>
            <span className="font-medium tabular-nums">{Math.round(pct)}%</span>
            <span className="text-muted-foreground tabular-nums">{formatKRW(target)}</span>
          </div>
          <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
            <div
              className={`h-2 rounded-full transition-all ${done ? "bg-emerald-400" : pct > 80 ? "bg-amber-400" : "bg-primary"}`}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {/* 적립 입력 */}
        {editing && !done && (
          <div className="mt-3 flex gap-2">
            <Input
              value={addValue}
              onChange={e => setAddValue(e.target.value)}
              placeholder="추가 금액 입력"
              className="h-8 text-xs tabular-nums"
              autoFocus
              onKeyDown={e => { if (e.key === "Enter") handleAdd(); if (e.key === "Escape") setEditing(false); }}
            />
            <Button size="sm" className="h-8 px-3 text-xs" onClick={handleAdd} disabled={saving}>
              <Check size={12} /> 추가
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function AddGoalForm({ onAdded }: { onAdded: () => void }) {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("🎯");
  const [targetAmount, setTargetAmount] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function submit() {
    if (!name.trim() || !targetAmount) return;
    setSaving(true);
    await fetch("/api/goals", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name, icon,
        targetAmount: parseInt(targetAmount.replace(/,/g, "")),
        targetDate: targetDate || null,
      }),
    });
    setName(""); setTargetAmount(""); setTargetDate(""); setIcon("🎯");
    setSaving(false);
    setOpen(false);
    onAdded();
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
      <CardContent className="pt-4 pb-4 space-y-3">
        <p className="text-sm font-semibold text-foreground">새 목표</p>

        {/* 아이콘 선택 */}
        <div className="flex gap-2 flex-wrap">
          {ICON_OPTIONS.map(ic => (
            <button
              key={ic}
              onClick={() => setIcon(ic)}
              className={`text-xl p-1 rounded-lg transition-colors ${icon === ic ? "bg-primary/20 ring-1 ring-primary" : "hover:bg-accent"}`}
            >
              {ic}
            </button>
          ))}
        </div>

        <Input
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="목표 이름 (예: 결혼 자금)"
          className="h-9 text-sm"
        />
        <Input
          value={targetAmount}
          onChange={e => setTargetAmount(e.target.value)}
          placeholder="목표 금액 (원)"
          className="h-9 text-sm tabular-nums"
          type="number"
          min={0}
        />
        <div>
          <label className="text-xs text-muted-foreground mb-1 block">목표일 (선택)</label>
          <input
            type="date"
            value={targetDate}
            onChange={e => setTargetDate(e.target.value)}
            className="w-full h-9 px-3 rounded-lg border border-border bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>

        <div className="flex gap-2 pt-1">
          <Button variant="ghost" size="sm" className="flex-1" onClick={() => setOpen(false)}>취소</Button>
          <Button size="sm" className="flex-1" onClick={submit} disabled={saving || !name.trim() || !targetAmount}>
            {saving ? "저장 중..." : "저장"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function GoalsPage() {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchGoals = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/goals");
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
  const completed = goals.filter(g => g.isCompleted || Number(g.savedAmount) >= Number(g.targetAmount));

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
              <Skeleton className="h-2 w-full rounded-full" />
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
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">진행 중 ({active.length})</p>
              {active.map(goal => (
                <GoalCard key={goal.id} goal={goal} onUpdate={handleUpdate} onDelete={handleDelete} />
              ))}
            </div>
          )}

          {completed.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">달성 완료 ({completed.length})</p>
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
