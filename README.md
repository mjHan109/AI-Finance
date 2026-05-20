# 🍇 Podo — AI 개인 가계부

XLSX/CSV 파일을 업로드하면 자동으로 분석해주는 AI 기반 개인 재정 관리 앱입니다.

## 주요 기능

- **파일 업로드** — KB국민은행, 뱅크샐러드 XLSX/CSV 지원
- **자동 분류** — 거래 내역을 카테고리로 자동 분류 (식비, 교통, 쇼핑 등 13개)
- **대시보드** — 월별 수입/지출 요약, 저축률, 전월 대비 비교
- **거래 내역** — 월별 필터, 카테고리 필터, 검색, 페이지네이션
- **예산 관리** — 카테고리별 예산 설정 및 사용률 추적
- **리포트** — 요일별/주차별 지출 패턴, 상위 지출처 TOP 10, 자동 인사이트

## 기술 스택

| 분류 | 기술 |
|------|------|
| 프레임워크 | Next.js 16, React, TypeScript |
| 스타일 | Tailwind CSS |
| 데이터베이스 | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| 인증 | NextAuth v5 |
| 차트 | Recharts |
| 파일 파싱 | SheetJS (xlsx) |

## 로컬 개발 환경 설정

### 1. 패키지 설치

```bash
npm install
```

### 2. 환경변수 설정

`.env.example`을 복사해서 `.env.local` 생성 후 값을 입력합니다.

```bash
cp .env.example .env.local
```

```env
DATABASE_URL="postgresql://..."   # Supabase 연결 문자열
NEXTAUTH_URL="http://localhost:4000"
NEXTAUTH_SECRET=""                # openssl rand -base64 32
```

### 3. 카테고리 초기 데이터 삽입

```bash
npx tsx scripts/seed-categories.ts
```

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:4000](http://localhost:4000) 접속

## 거래 내역 재분류

새 분류 규칙 적용 또는 키워드 추가 후 기존 데이터를 재분류하려면:

```bash
npx tsx scripts/reclassify.ts
```

또는 앱 내 **거래 내역** 페이지의 🔄 재분류 버튼 클릭

## Vercel 배포

필요한 환경변수:

| 변수명 | 설명 |
|--------|------|
| `DATABASE_URL` | Supabase PostgreSQL 연결 문자열 |
| `NEXTAUTH_SECRET` | 랜덤 시크릿 키 (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | 배포된 앱 URL |
| `AUTH_TRUST_HOST` | `true` |

## 프로젝트 구조

```
src/
├── app/
│   ├── dashboard/        # 대시보드, 거래내역, 예산, 리포트 페이지
│   ├── upload/           # 파일 업로드 페이지
│   ├── login/            # 로그인/회원가입
│   └── api/              # API 라우트
├── components/
│   ├── charts/           # Recharts 차트 컴포넌트
│   └── ui/               # 공통 UI 컴포넌트
├── modules/
│   ├── files/            # 파일 파서 (KB, 뱅크샐러드)
│   └── categories/       # 자동 분류 규칙
└── lib/                  # 인증, DB, 유틸리티
```
