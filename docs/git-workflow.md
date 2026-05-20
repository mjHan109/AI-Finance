# Git Workflow

## 브랜치 전략

```
master          ← 배포 가능한 안정 브랜치 (직접 커밋 지양)
feat/xxx        ← 기능 개발
fix/xxx         ← 버그 수정
chore/xxx       ← 설정, 의존성, 문서 변경
```

### 기본 흐름

```bash
# 새 기능 시작
git checkout -b feat/budget-chart

# 작업 후 커밋
git add -A
git commit -m "feat: 예산 vs 실지출 바 차트 추가"

# master에 병합
git checkout master
git merge feat/budget-chart
git push origin master

# 브랜치 정리
git branch -d feat/budget-chart
```

---

## 커밋 메시지 규칙

```
<type>: <내용> (한글 가능)
```

| type | 용도 |
|------|------|
| `feat` | 새 기능 |
| `fix` | 버그 수정 |
| `chore` | 설정, 패키지, 문서 |
| `refactor` | 기능 변경 없는 코드 정리 |
| `style` | UI/스타일 변경 |

**예시**
```
feat: 카테고리 도넛 차트 추가
fix: 로그인 후 대시보드 리다이렉트 오류 수정
chore: FinancialAccount 마이그레이션 추가
style: 사이드바 활성 메뉴 색상 조정
```

---

## Push 규칙

### 반드시 지켜야 할 것

- `.env.local` **절대 커밋/푸시 금지** (Supabase URL, 시크릿 키 포함)
- `node_modules/`, `.next/` 푸시 금지 (`.gitignore`에 이미 등록됨)
- `prisma/migrations/` 는 **반드시 포함** — DB 히스토리

### 환경변수 관리

- `.env.example` — 키 이름만 적고 값은 비워서 커밋 ✅
- `.env.local` — 실제 값, 절대 커밋 금지 ❌

```bash
# .env.example 형식
DATABASE_URL=
NEXTAUTH_SECRET=
NEXTAUTH_URL=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
```

### DB 스키마 변경 시

```bash
# 1. schema.prisma 수정
# 2. 마이그레이션 생성
npx prisma migrate dev --name 변경내용설명

# 3. 커밋에 migration.sql 포함해서 푸시
git add prisma/
git commit -m "chore: xxx 필드 추가 마이그레이션"
git push
```

---

## 자주 쓰는 명령어

```bash
# 현재 상태 확인
git status
git log --oneline -10

# 변경사항 푸시
git add -A
git commit -m "feat: ..."
git push

# 원격 최신 내용 받기
git pull origin master

# 브랜치 목록
git branch -a
```

---

## 현재 원격 저장소

- **GitHub:** git@github.com:mjHan109/AI-Finance.git
- **기본 브랜치:** master
