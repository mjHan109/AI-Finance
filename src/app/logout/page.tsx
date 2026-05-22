"use client";

import { useEffect } from "react";
import { signOut } from "next-auth/react";

export default function LogoutPage() {
  useEffect(() => {
    signOut({ callbackUrl: "/login" });
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-3">
        <div className="text-4xl">🍇</div>
        <p className="text-sm text-muted-foreground">로그아웃 중...</p>
      </div>
    </div>
  );
}
