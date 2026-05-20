import { AuthTabs } from "./auth-tabs";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="w-full max-w-sm space-y-6">

        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="text-6xl">🍇</div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            Podo
          </h1>
          <p className="text-muted-foreground text-sm">
            포도처럼 알차게 모아가는 내 돈 관리
          </p>
        </div>

        {/* Auth Card */}
        <AuthTabs />

      </div>
    </div>
  );
}
