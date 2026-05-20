"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  List,
  Target,
  BarChart2,
  Upload,
  LogOut,
} from "lucide-react";

const NAV = [
  { href: "/dashboard", label: "홈", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/transactions", label: "거래 내역", icon: List },
  { href: "/dashboard/budget", label: "예산", icon: Target },
  { href: "/dashboard/reports", label: "리포트", icon: BarChart2 },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  function isActive(href: string, exact?: boolean) {
    return exact ? pathname === href : pathname.startsWith(href);
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* 사이드바 */}
      <aside className="w-56 shrink-0 flex flex-col border-r border-border bg-card">
        {/* 로고 */}
        <div className="px-5 py-5 flex items-center gap-2 border-b border-border">
          <span className="text-2xl">🍇</span>
          <span className="text-lg font-bold text-foreground tracking-tight">Podo</span>
        </div>

        {/* 네비게이션 */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV.map(({ href, label, icon: Icon, exact }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors
                ${isActive(href, exact)
                  ? "bg-primary/15 text-primary"
                  : "text-muted-foreground hover:bg-accent hover:text-foreground"
                }`}
            >
              <Icon size={17} />
              {label}
            </Link>
          ))}
        </nav>

        {/* 하단 */}
        <div className="px-3 py-4 border-t border-border space-y-0.5">
          <Link
            href="/upload"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <Upload size={17} />
            파일 업로드
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            <LogOut size={17} />
            로그아웃
          </button>
        </div>
      </aside>

      {/* 메인 컨텐츠 */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
