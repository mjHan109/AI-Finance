# 모바일 앱 전환 로드맵

전환 순서: Web App → PWA → API 표준화 → React Native (Expo)

백엔드(Prisma, Supabase, `/api/*`)는 모든 단계에서 변경 없음.

---

## 현재 상태

- 현재 단계: PWA 준비 중
- PWA: 미시작
- React Native: 미시작
- 참고 문서: `docs/architecture/mobile_strategy.md`

---

## Phase 1 — PWA 통합

**브랜치:** `feature/pwa`
**선행 조건:** Phase 5·6과 병행 가능 (독립적)

### 주의사항

- Next.js 16.2.6 — `node_modules/next/dist/docs/` 확인 후 코드 작성
- `@ducanh2912/next-pwa` Next.js 16 호환성 확인 필수
- 현재 `next.config.ts`의 CSP에 `worker-src 'self'`가 없음 → 서비스 워커 차단됨

### 태스크

1. **문서 확인** — `node_modules/next/dist/docs/`에서 Next.js 16 PWA 가이드 확인
2. **패키지 설치** — `@ducanh2912/next-pwa` 설치 (버전 호환성 확인 후)
3. **CSP 수정** — `next.config.ts`에 `worker-src 'self'` 추가
4. **manifest.json 생성** — `public/manifest.json`
   ```json
   {
     "name": "podo 가계부",
     "short_name": "podo",
     "theme_color": "#ffffff",
     "background_color": "#ffffff",
     "display": "standalone",
     "start_url": "/dashboard",
     "icons": [
       { "src": "/icons/icon-192.png", "sizes": "192x192", "type": "image/png" },
       { "src": "/icons/icon-512.png", "sizes": "512x512", "type": "image/png" }
     ]
   }
   ```
5. **앱 아이콘 생성** — `public/icons/` 디렉토리에 192x192, 512x512 PNG
6. **next.config.ts 수정** — `withPWA` 래퍼 적용, 캐싱 전략 설정
7. **캐싱 전략**
   - 캐시 대상: 정적 자산 (JS, CSS, 이미지, 폰트)
   - 캐시 제외: `/api/*` 모든 라우트 (금융 데이터는 항상 최신 데이터 필요)
8. **모바일 뷰포트 검토** — 터치 UX, 홈화면 추가 지원 확인

### 검증

- Lighthouse PWA 점수 ≥ 90
- `/manifest.json` 브라우저에서 접근 가능
- DevTools > Application > Service Workers에 등록됨
- 모바일 Chrome/Safari에서 "홈화면에 추가" 프롬프트 표시

### 금지사항

- 서비스 워커 JS 직접 작성 금지 (next-pwa 추상화 사용)
- `/api/*` 라우트 캐싱 금지
- 기존 CSP 보안 설정 제거 금지

---

## Phase 2 — API 표준화

**브랜치:** `feature/api-standardization`
**선행 조건:** Phase 5(AI 기능) 완료 후 진행 권장

### 현재 API 응답 형식 (불일치)

| 라우트 | 성공 응답 | 오류 응답 |
|--------|-----------|-----------|
| `GET /api/transactions` | `{ transactions, total, page, totalPages }` | `{ error }` |
| `GET /api/budgets` | `{ year, month, items }` | `{ error }` |
| `GET /api/goals` | 배열 직접 반환 | `{ error }` |
| `GET /api/health` | 객체 직접 반환 | `{ error }` |

### 목표 표준 형식

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### 태스크

1. **응답 헬퍼 생성** — `src/lib/api-response.ts`
   ```typescript
   export function apiSuccess(data: unknown, status = 200) {
     return NextResponse.json({ success: true, data, error: null }, { status });
   }
   export function apiError(message: string, status: number) {
     return NextResponse.json({ success: false, data: null, error: message }, { status });
   }
   ```
2. **16개 API 라우트 업데이트** — 표준 형식 적용
3. **프론트엔드 컴포넌트 업데이트** — API 응답 소비 코드 모두 수정
4. **CORS 헤더 추가** — 모바일 클라이언트를 위한 설정
5. **환경변수 추가** — `NEXT_PUBLIC_API_BASE_URL`
6. **API 문서 업데이트** — `docs/api.md` 최신화

### 주의사항

- 대규모 변경: 16개 라우트 + 연관 프론트엔드 컴포넌트 동시 수정
- 기존 대시보드 회귀 테스트 필수
- 한 번에 모든 라우트 변경 (부분 적용 금지)

### 검증

- 모든 API 라우트가 `{ success, data, error }` 반환
- 기존 대시보드 정상 동작
- `docs/api.md` 업데이트 완료

---

## Phase 3 — React Native (Expo)

**레포지토리:** 별도 레포 `podo-mobile` (현재 레포에 추가 금지)
**선행 조건:** Phase 1 + Phase 2 완료, 웹 앱 안정화 후

### 아키텍처

```
podo-mobile
    ↓
https://podo-web.vercel.app/api/*
    ↓
  Prisma
    ↓
Supabase PostgreSQL
```

**규칙:** 모바일 앱은 PostgreSQL 또는 Supabase DB 테이블에 직접 연결 금지.
모든 DB 접근은 반드시 기존 백엔드 API 레이어를 통해서만 허용.

### 태스크

1. `npx create-expo-app podo-mobile` 프로젝트 생성
2. API 클라이언트 모듈 구현 (base URL: `https://podo-web.vercel.app/api`)
3. 모바일 인증 흐름 구현 (전략은 `mobile_strategy.md` 참고 — 개발 시작 시 재검토)
4. 파일 업로드 UX (`expo-document-picker` 사용, 기존 `/api/upload` 재사용)
5. 앱 스토어 배포 준비

---

## 브랜치 전략

```
main
  └── feature/pwa              ← Phase 1 PWA
  └── feature/api-standardization  ← Phase 2 API 표준화

podo-mobile (별도 레포)        ← Phase 3 React Native
```

---

## 변경 불필요 항목

- PostgreSQL
- Supabase
- Prisma 스키마
- 기존 `/api/*` 라우트 구조
- Vercel 배포 설정
