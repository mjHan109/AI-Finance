"use client"

import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

type UploadState = "idle" | "uploading" | "done" | "error"

interface UploadResult {
  source: string
  total: number
  saved: number
  duplicates: number
  errors: string[]
}

interface FinancialAccount {
  id: string
  name: string
  type: "BANK" | "CARD" | "CASH"
  _count?: { transactions: number }
}

const ACCOUNT_TYPE_LABEL: Record<string, string> = {
  BANK: "🏦 은행 통장",
  CARD: "💳 카드",
  CASH: "💵 현금",
}

const ACCOUNT_COLORS: Record<string, string> = {
  BANK: "text-blue-400",
  CARD: "text-violet-400",
  CASH: "text-emerald-400",
}

export function UploadForm() {
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [state, setState] = useState<UploadState>("idle")
  const [dragOver, setDragOver] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [errorMsg, setErrorMsg] = useState("")

  // 계좌 선택
  const [accounts, setAccounts] = useState<FinancialAccount[]>([])
  const [selectedAccountId, setSelectedAccountId] = useState<string>("none")
  const [newAccountName, setNewAccountName] = useState("")
  const [newAccountType, setNewAccountType] = useState<"BANK" | "CARD" | "CASH">("BANK")

  useEffect(() => {
    fetch("/api/accounts")
      .then((r) => r.json())
      .then((data) => { if (Array.isArray(data)) setAccounts(data) })
      .catch(() => {})
  }, [])

  function handleFile(f: File) {
    setFile(f)
    setState("idle")
    setResult(null)
    setErrorMsg("")
  }

  async function handleUpload() {
    if (!file) return
    setState("uploading")
    setErrorMsg("")

    const form = new FormData()
    form.append("file", file)

    if (selectedAccountId === "new") {
      if (newAccountName.trim()) {
        form.append("accountName", newAccountName.trim())
        form.append("accountType", newAccountType)
      }
    } else if (selectedAccountId !== "none") {
      const acc = accounts.find((a) => a.id === selectedAccountId)
      if (acc) {
        form.append("accountName", acc.name)
        form.append("accountType", acc.type)
      }
    }
    // selectedAccountId === "none" → 계좌 태그 없이 업로드

    const res = await fetch("/api/upload", { method: "POST", body: form })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}

    if (!res.ok) {
      setState("error")
      setErrorMsg(data.error ?? "업로드 중 오류가 발생했습니다.")
      return
    }

    setState("done")
    setResult(data)
  }

  const sourceLabel: Record<string, string> = {
    kb: "KB국민은행",
    banksalad: "뱅크샐러드",
    generic: "일반 형식",
  }

  return (
    <div className="space-y-4">
      {/* 드래그 앤 드롭 영역 */}
      <Card
        className={`border-2 border-dashed transition-colors cursor-pointer
          ${dragOver ? "border-primary bg-accent" : "border-border hover:border-primary/50"}
          ${file ? "border-primary/60 bg-accent/30" : ""}`}
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault()
          setDragOver(false)
          const f = e.dataTransfer.files[0]
          if (f) handleFile(f)
        }}
      >
        <CardContent className="py-12 flex flex-col items-center gap-3 text-center">
          <div className="text-4xl">{file ? "📄" : "📂"}</div>
          {file ? (
            <>
              <p className="font-medium text-foreground">{file.name}</p>
              <p className="text-sm text-muted-foreground">
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <button
                className="text-xs text-muted-foreground underline"
                onClick={(e) => { e.stopPropagation(); setFile(null); setState("idle") }}
              >
                다른 파일 선택
              </button>
            </>
          ) : (
            <>
              <p className="font-medium text-foreground">파일을 드래그하거나 클릭해서 선택</p>
              <p className="text-xs text-muted-foreground">xlsx, xls, csv · 최대 10MB</p>
              <p className="text-xs text-muted-foreground/70">국민은행 · 뱅크샐러드 지원</p>
            </>
          )}
        </CardContent>
      </Card>

      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }}
      />

      {/* 계좌 선택 */}
      {file && state !== "done" && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div>
              <p className="text-sm font-medium text-foreground">계좌 태그 (선택사항)</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                뱅크샐러드처럼 여러 계좌가 합쳐진 파일은 태그 없이 업로드하세요
              </p>
            </div>

            <div className="space-y-2">
              {/* 계좌 구분 없음 (기본) */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="account"
                  value="none"
                  checked={selectedAccountId === "none"}
                  onChange={() => setSelectedAccountId("none")}
                  className="accent-primary"
                />
                <span className="text-sm font-medium text-foreground">계좌 태그 없음</span>
                <span className="text-xs text-muted-foreground">(뱅크샐러드 등 전체 내역 파일)</span>
              </label>

              {/* 기존 계좌 */}
              {accounts.map((acc) => (
                <label key={acc.id} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="account"
                    value={acc.id}
                    checked={selectedAccountId === acc.id}
                    onChange={() => setSelectedAccountId(acc.id)}
                    className="accent-primary"
                  />
                  <span className={`text-sm font-medium ${ACCOUNT_COLORS[acc.type]}`}>
                    {ACCOUNT_TYPE_LABEL[acc.type]}
                  </span>
                  <span className="text-sm text-foreground">{acc.name}</span>
                  {acc._count && (
                    <span className="ml-auto text-xs text-muted-foreground">
                      {acc._count.transactions}건
                    </span>
                  )}
                </label>
              ))}

              {/* 새 계좌 */}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="account"
                  value="new"
                  checked={selectedAccountId === "new"}
                  onChange={() => setSelectedAccountId("new")}
                  className="accent-primary"
                />
                <span className="text-sm text-muted-foreground">+ 특정 계좌로 태그하기</span>
              </label>
            </div>

            {/* 새 계좌 입력 */}
            {selectedAccountId === "new" && (
              <div className="pl-6 space-y-3 pt-1">
                <div className="space-y-1.5">
                  <Label className="text-xs">계좌 종류</Label>
                  <div className="flex gap-2">
                    {(["BANK", "CARD", "CASH"] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setNewAccountType(t)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors
                          ${newAccountType === t
                            ? "border-primary bg-primary/15 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/40"
                          }`}
                      >
                        {ACCOUNT_TYPE_LABEL[t]}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">계좌 이름 (선택)</Label>
                  <Input
                    placeholder={newAccountType === "BANK" ? "예: 국민은행 입출금" : newAccountType === "CARD" ? "예: 신한카드" : "예: 지갑"}
                    value={newAccountName}
                    onChange={(e) => setNewAccountName(e.target.value)}
                    className="h-8 text-sm"
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* 업로드 버튼 */}
      {file && state !== "done" && (
        <Button
          className="w-full"
          size="lg"
          onClick={handleUpload}
          disabled={state === "uploading"}
        >
          {state === "uploading" ? (
            <span className="flex items-center gap-2">
              <span className="animate-spin">🍇</span> 분석 중...
            </span>
          ) : "업로드 시작"}
        </Button>
      )}

      {state === "uploading" && <Progress className="h-1.5" value={null} />}

      {/* 에러 */}
      {state === "error" && (
        <Card className="border-destructive/40 bg-destructive/10">
          <CardContent className="py-4 text-sm text-destructive">
            ⚠️ {errorMsg}
          </CardContent>
        </Card>
      )}

      {/* 결과 */}
      {state === "done" && result && (
        <Card className="border-primary/30 bg-accent/20">
          <CardContent className="py-5 space-y-3">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <span>✅</span>
              <span>업로드 완료!</span>
              <span className="text-xs text-muted-foreground ml-auto">
                {sourceLabel[result.source] ?? result.source}
              </span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-card rounded-lg p-3">
                <p className="text-2xl font-bold text-foreground">{result.total}</p>
                <p className="text-xs text-muted-foreground">전체 행</p>
              </div>
              <div className="bg-card rounded-lg p-3">
                <p className="text-2xl font-bold text-primary">{result.saved}</p>
                <p className="text-xs text-muted-foreground">저장됨</p>
              </div>
              <div className="bg-card rounded-lg p-3">
                <p className="text-2xl font-bold text-muted-foreground">{result.duplicates}</p>
                <p className="text-xs text-muted-foreground">중복 제외</p>
              </div>
            </div>
            {result.errors.length > 0 && (
              <details className="text-xs text-muted-foreground">
                <summary className="cursor-pointer">경고 {result.errors.length}건</summary>
                <ul className="mt-1 space-y-0.5 list-disc list-inside">
                  {result.errors.slice(0, 10).map((e, i) => <li key={i}>{e}</li>)}
                </ul>
              </details>
            )}
            <Button className="w-full" onClick={() => router.push("/dashboard")}>
              대시보드로 이동 →
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
