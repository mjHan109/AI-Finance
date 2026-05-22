import { NextRequest, NextResponse } from "next/server";
import { AUTH_ROUTES } from "@/lib/auth-routes";

const protectedRoutes = [
  "/dashboard", "/upload",
  "/api/upload", "/api/accounts", "/api/budgets", "/api/categories",
  "/api/transactions", "/api/reports", "/api/reclassify", "/api/goals",
  "/api/health", "/api/ai",
];

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname;
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r));
  const isLoginPage      = path === AUTH_ROUTES.login;

  // NextAuth v5 uses authjs.* cookie names
  const sessionCookie =
    req.cookies.get("authjs.session-token") ??
    req.cookies.get("__Secure-authjs.session-token");
  const isLoggedIn = !!sessionCookie;

  if (isProtectedRoute && !isLoggedIn) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.login, req.nextUrl));
  }

  if (isLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL(AUTH_ROUTES.dashboard, req.nextUrl));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/auth).*)"],
};
