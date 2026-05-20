# Architecture

## Stack
- **Frontend/Backend:** Next.js 16 (App Router, webpack mode)
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4 + shadcn/ui
- **Database:** PostgreSQL (Supabase ap-northeast-2)
- **ORM:** Prisma 7 + PrismaPg adapter
- **Auth:** NextAuth v5 beta (JWT strategy)
- **Charts:** Recharts
- **File Parsing:** SheetJS (xlsx/xls) + PapaParse (csv)

---

## Directory Structure

```
src/
├── app/
│   ├── dashboard/
│   │   ├── layout.tsx          # 사이드바 레이아웃 (client)
│   │   ├── page.tsx            # 홈 대시보드
│   │   ├── transactions/       # 거래 내역
│   │   ├── budget/             # 예산
│   │   └── reports/            # 리포트
│   ├── upload/                 # 파일 업로드
│   ├── login/                  # 로그인/회원가입
│   └── api/
│       ├── auth/               # NextAuth + 회원가입
│       ├── upload/             # 파일 업로드 처리
│       └── accounts/           # 금융 계좌 CRUD
├── lib/
│   ├── auth.ts                 # NextAuth 설정 (JWT, Google + Credentials)
│   ├── prisma.ts               # Prisma 클라이언트 싱글톤
│   └── password.ts             # 비밀번호 검증
└── modules/
    └── files/
        ├── parse.ts            # 파일 포맷 자동 감지
        ├── normalize.ts        # 날짜/금액 정규화, fingerprint
        ├── types.ts            # RawTransaction, ParseResult 타입
        └── parsers/
            ├── kb.ts           # KB국민은행 파서
            └── banksalad.ts    # 뱅크샐러드 파서
```

---

## Auth Flow

```
로그인 (email/pw)
  → signIn("credentials", { redirect: false })
  → result.ok? → window.location.href = "/dashboard"
  → proxy.ts 미들웨어: authjs.session-token 쿠키 확인
  → 인증 없으면 /login 리다이렉트
```

NextAuth v5 + Credentials는 반드시 **JWT session strategy** 사용 (database strategy 미지원).

---

## 파일 업로드 Flow

```
1. 사용자: 파일 선택 + 계좌 선택/등록
2. POST /api/upload (multipart: file + accountName + accountType)
3. 서버: 확장자/크기 검증
4. 서버: parseFile() → 포맷 자동 감지 (KB/뱅크샐러드/generic)
5. 서버: FinancialAccount upsert
6. 서버: 각 거래 fingerprint 계산 → 중복 skip → 저장
7. 응답: { total, saved, duplicates, errors }
```

---

## 금융 계좌 구분 (FinancialAccount)

개인 가계부에서 복식부기 대신 **계좌 단위 분류**를 사용:
- `BANK` — 은행 입출금/예금 통장
- `CARD` — 신용카드/체크카드
- `CASH` — 현금

업로드 시 어느 계좌의 내역인지 선택하면 모든 거래에 자동 연결됨.

---

## Known Quirks

| 이슈 | 해결책 |
|------|--------|
| Prisma 7 `#main-entry-point` 오류 | `scripts/patch-prisma.js` postinstall 패치 |
| Next.js 16 미들웨어 파일명 변경 | `middleware.ts` → `proxy.ts` |
| 한글 경로 Turbopack JSON 파싱 오류 | `next dev --webpack` 사용 |
| Credentials + database session 미지원 | JWT strategy로 전환 |
