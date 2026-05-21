# 모바일 앱 전환 로드맵

## 전략 요약

웹 → PWA → React Native 순서로 단계적으로 전환한다.
PostgreSQL / Supabase / Prisma는 모든 단계에서 그대로 유지.
모바일 앱도 반드시 기존 `/api/*`를 통해 DB에 접근한다 (직접 연결 금지).

---

## 인프라 구조 (변경 없음)

```
[웹 브라우저 / React Native 앱]
          ↓
  Next.js API Routes (/api/*)
          ↓
        Prisma
          ↓
  Supabase PostgreSQL
```

---

## 단계별 계획

### 1단계: PWA 적용 (현재)

현재 Next.js 웹에 PWA 기능 추가. 코드 변경 최소화.

**작업 목록**
- `next-pwa` 패키지 설치 및 설정
- `manifest.json` 추가 (앱 이름, 아이콘, 테마 색상)
- Service Worker 설정 (오프라인 캐싱)
- 모바일 뷰포트 및 터치 UX 개선
- "홈 화면에 추가" 지원 확인

**장점**
- 기존 코드 그대로 재사용
- Vercel 배포 그대로 유지
- Android/iOS 홈 화면 설치 가능

**한계**
- 앱스토어 배포 불가
- 기기 센서(카메라 등) 접근 제한

---

### 2단계: API 안정화

React Native 앱에서도 재사용 가능하도록 API 정리.

**작업 목록**
- API 응답 구조 표준화 (공통 에러 포맷)
- 환경변수 점검 및 정리 (아래 참고)
- CORS 설정 검토 (외부 클라이언트 허용 준비)
- 주요 API 문서화 업데이트 (`docs/api.md`)
- 인증 토큰 방식 검토 (쿠키 vs Bearer 토큰)

**환경변수 체크리스트**
```
NEXTAUTH_URL          - Vercel 배포 주소로 설정
AUTH_SECRET           - 강한 랜덤값
GOOGLE_CLIENT_ID      - Google Cloud Console
GOOGLE_CLIENT_SECRET  - Google Cloud Console
DATABASE_URL          - Supabase 연결 풀 URL
DIRECT_URL            - Supabase 직접 연결 URL (마이그레이션용)
ANTHROPIC_API_KEY     - AI 기능 활성화 시 필요
NEXT_PUBLIC_API_BASE_URL - https://your-domain.vercel.app (앱에서 API 호출용)
```

---

### 3단계: React Native (Expo) 앱

별도 프로젝트로 모바일 앱 생성. 기존 API 서버는 그대로 사용.

**프로젝트 구조**
```
finance-app/          ← 기존 Next.js (API 서버 + 웹)
finance-app-mobile/   ← Expo 신규 프로젝트
```

**주요 작업**
- Expo 프로젝트 생성
- API 클라이언트 모듈 작성 (`NEXT_PUBLIC_API_BASE_URL` 기반)
- 모바일 전용 인증 전략 결정 (아래 참고)
- 파일 업로드 UX 구현 (Expo 플러그인 사용)
- 앱스토어 배포 준비

---

## 주요 검토 사항

### 인증 전략

| 단계 | 방식 |
|------|------|
| PWA (1단계) | 기존 NextAuth 그대로 사용 |
| React Native (3단계) | 아래 3가지 중 선택 |

React Native 인증 선택지:
1. **기존 NextAuth API 연동 유지** — 변경 최소, 쿠키 처리 복잡
2. **Supabase Auth 전환** — 장기적으로 앱/웹 통합에 유리
3. **자체 JWT API 구현** — `/api/mobile/auth` 별도 엔드포인트

> 현재 권장: 3단계 진입 시점에 재검토. 지금 갈아엎을 필요 없음.

---

### 파일 업로드 UX

웹과 달리 모바일에서는 아래 방식이 필요:
- 파일 선택: `expo-document-picker`
- 카메라 촬영 / 갤러리 선택: `expo-image-picker`

기존 `/api/upload`는 그대로 재사용 가능.
모바일 클라이언트에서 multipart/form-data로 전송하는 방식 유지.

---

### CORS 처리

- **웹 (동일 도메인)**: 문제 없음
- **모바일 앱 (외부 호출)**: CORS + 인증 쿠키 문제 발생 가능

대응 방안: 모바일 전용 API 엔드포인트 분리 (3단계에서 검토)
```
/api/mobile/auth
/api/mobile/upload
/api/mobile/transactions
```
> 1~2단계에서는 불필요. React Native 개발 시작 시 검토.

---

## 변경 불필요 항목

- PostgreSQL / Supabase — 그대로 사용
- Prisma 스키마 — 그대로 사용
- 기존 `/api/*` 라우트 — 그대로 재사용
- Vercel 배포 — 그대로 유지

---

## 현재 상태 (2026-05-21 기준)

- [x] Next.js 웹앱 배포 완료 (Vercel)
- [x] PostgreSQL / Supabase 연동
- [x] 파일 업로드 & 거래 파싱
- [x] 카테고리 자동 분류
- [x] 예산 및 리포트
- [ ] PWA 적용
- [ ] API 표준화
- [ ] React Native 앱
