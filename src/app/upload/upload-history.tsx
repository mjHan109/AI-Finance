"use client";

import { useEffect, useState } from "react";
import { FileText, ChevronDown, ChevronUp } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

interface UploadRecord {
  id: string;
  originalName: string;
  fileType: string;
  rowCount: number;
  parsedAt: string;
  _count: { transactions: number };
}

export function UploadHistory() {
  const [records, setRecords] = useState<UploadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    fetch("/api/upload/history")
      .then((r) => r.json())
      .then((data: UploadRecord[]) => {
        setRecords(data);
        setLoading(false);
      });
  }, []);

  if (!loading && records.length === 0) return null;

  return (
    <div className="mt-8">
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
      >
        {open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        업로드 내역 {!loading && `(${records.length}건)`}
      </button>

      {open && (
        <div className="mt-3 rounded-xl border border-border bg-card overflow-hidden">
          {loading ? (
            <div className="divide-y divide-border">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-3 px-4 py-3">
                  <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
                  <div className="flex-1 space-y-1.5">
                    <Skeleton className="h-3.5 w-48" />
                    <Skeleton className="h-3 w-28" />
                  </div>
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {records.map((r) => (
                <li key={r.id} className="flex items-center gap-3 px-4 py-3">
                  <div className="h-8 w-8 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    <FileText size={14} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{r.originalName}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(r.parsedAt).toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul" })}{" "}
                      {new Date(r.parsedAt).toLocaleTimeString("ko-KR", { timeZone: "Asia/Seoul", hour: "2-digit", minute: "2-digit" })}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-medium text-foreground">{r._count.transactions}건 저장</p>
                    <p className="text-xs text-muted-foreground">{r.rowCount}행 파싱</p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
