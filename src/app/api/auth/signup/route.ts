import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { passwordErrorMessage } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { signupSchema, safeParse } from "@/lib/schemas";
import { log } from "@/lib/logger";

// 5분 안에 IP당 최대 10회
const SIGNUP_LIMIT  = 10;
const SIGNUP_WINDOW = 5 * 60 * 1000;

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
  const rl = checkRateLimit(`signup:${ip}`, SIGNUP_LIMIT, SIGNUP_WINDOW);
  if (!rl.allowed) {
    log("warn", "rate_limited", { event_detail: "signup", ip });
    return NextResponse.json(
      { error: `잠시 후 다시 시도해주세요. (${rl.retryAfterSec}초 후)` },
      { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
    );
  }

  try {
    const body   = await req.json();
    const parsed = safeParse(signupSchema, body);
    if (!parsed.ok) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }
    const { name, email, password } = parsed.data;

    const pwError = passwordErrorMessage(password);
    if (pwError) {
      return NextResponse.json({ error: pwError }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json({ error: "이미 사용 중인 이메일입니다." }, { status: 409 });
    }

    const hashed = await bcrypt.hash(password, 12);
    await prisma.user.create({ data: { name, email, password: hashed } });

    log("info", "auth_signup", { email });
    return NextResponse.json({ ok: true }, { status: 201 });
  } catch {
    log("error", "server_error", { route: "POST /api/auth/signup" });
    return NextResponse.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
}
