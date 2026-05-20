"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { validatePassword } from "@/lib/password";

export function AuthTabs() {
  return (
    <div className="bg-card border border-border rounded-xl p-6">
      <Tabs defaultValue="login">
        <TabsList className="w-full mb-6">
          <TabsTrigger value="login" className="flex-1">로그인</TabsTrigger>
          <TabsTrigger value="signup" className="flex-1">회원가입</TabsTrigger>
        </TabsList>
        <TabsContent value="login">
          <LoginForm />
        </TabsContent>
        <TabsContent value="signup">
          <SignupForm />
        </TabsContent>
      </Tabs>

      <div className="relative my-5">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-border" />
        </div>
        <div className="relative flex justify-center text-xs">
          <span className="bg-card px-2 text-muted-foreground">또는</span>
        </div>
      </div>

      <Button
        variant="outline"
        className="w-full gap-2"
        onClick={() => signIn("google", { callbackUrl: "/dashboard" })}
      >
        <GoogleIcon />
        Google로 계속하기
      </Button>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);

    if (!result || !result.ok || result.error) {
      setError("이메일 또는 비밀번호가 올바르지 않습니다.");
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="login-email">이메일</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="login-password">비밀번호</Label>
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "로그인 중..." : "로그인"}
      </Button>
    </form>
  );
}

const PW_RULES = [
  { label: "8자 이상", test: (pw: string) => pw.length >= 8 },
  { label: "영문자", test: (pw: string) => /[a-zA-Z]/.test(pw) },
  { label: "숫자", test: (pw: string) => /[0-9]/.test(pw) },
  { label: "특수문자", test: (pw: string) => /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pw) },
];

function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [pwTouched, setPwTouched] = useState(false);

  const pwValidation = validatePassword(password);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (!pwValidation.valid) {
      setError(`비밀번호 조건 미충족: ${pwValidation.errors.join(", ")}`);
      return;
    }
    if (password !== confirm) {
      setError("비밀번호가 일치하지 않습니다.");
      return;
    }

    setLoading(true);
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password }),
    });

    const text = await res.text();
    const data = text ? JSON.parse(text) : {};
    setLoading(false);

    if (!res.ok) {
      setError(data.error ?? "회원가입 중 오류가 발생했습니다.");
      return;
    }

    await signIn("credentials", { email, password, redirect: false });
    window.location.href = "/dashboard";
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="signup-name">이름</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="홍길동"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-email">이메일</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="you@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-password">비밀번호</Label>
        <Input
          id="signup-password"
          type="password"
          placeholder="영문, 숫자, 특수문자 포함 8자 이상"
          value={password}
          onChange={(e) => { setPassword(e.target.value); setPwTouched(true); }}
          required
        />
        {/* 비밀번호 조건 체크리스트 */}
        {pwTouched && (
          <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1">
            {PW_RULES.map((rule) => {
              const passed = rule.test(password);
              return (
                <span
                  key={rule.label}
                  className={`text-xs ${passed ? "text-emerald-400" : "text-muted-foreground"}`}
                >
                  {passed ? "✓" : "○"} {rule.label}
                </span>
              );
            })}
          </div>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="signup-confirm">비밀번호 확인</Label>
        <Input
          id="signup-confirm"
          type="password"
          placeholder="••••••••"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
        />
        {confirm && (
          <p className={`text-xs pt-1 ${password === confirm ? "text-emerald-400" : "text-destructive"}`}>
            {password === confirm ? "✓ 비밀번호가 일치합니다" : "○ 비밀번호가 일치하지 않습니다"}
          </p>
        )}
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button type="submit" className="w-full" disabled={loading || !pwValidation.valid || password !== confirm}>
        {loading ? "가입 중..." : "회원가입"}
      </Button>
    </form>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 6.29C4.672 4.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
