# Database Schema

## Overview
PostgreSQL on Supabase (ap-northeast-2). Prisma 7 with PrismaPg adapter (JWT session strategy).

---

## Models

### User
사용자 계정. 이메일/비밀번호 또는 Google OAuth로 가입.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| email | String | unique |
| name | String? | 표시 이름 |
| password | String? | bcrypt(12) 해시. Google OAuth 사용자는 null |
| image | String? | 프로필 이미지 URL |

---

### FinancialAccount
사용자의 실제 금융 계좌/카드. 거래 내역 업로드 시 분류 기준.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| name | String | 계좌 이름 (예: "국민은행 입출금", "신한카드") |
| type | FinancialAccountType | BANK / CARD / CASH |
| color | String? | UI 표시용 색상 코드 |

**FinancialAccountType enum**
- `BANK` — 은행 입출금/예금 통장
- `CARD` — 신용카드/체크카드
- `CASH` — 현금 지출

**유니크 제약:** `[userId, name]` — 같은 사용자가 같은 이름의 계좌를 중복 생성 불가.

---

### Transaction
파싱된 거래 내역 1건.

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| userId | String | FK → User |
| fileId | String | FK → UploadedFile |
| financialAccountId | String? | FK → FinancialAccount (선택) |
| date | DateTime | 거래일시 |
| description | String | 거래 설명 (정규화됨) |
| amount | Decimal(15,2) | 거래 금액 (항상 양수) |
| isIncome | Boolean | true=수입, false=지출 |
| categoryId | String? | FK → Category |
| classifiedBy | ClassificationSource | RULE / AI / USER |
| isSubscription | Boolean | 정기 구독 여부 |
| fingerprint | String | 중복 방지 해시 (sha256 of date+desc+amount) |

**유니크 제약:** `[userId, fingerprint]` — 동일 거래 중복 저장 방지.

---

### Category
지출/수입 카테고리 (식비, 교통, 쇼핑 등).

| 필드 | 타입 | 설명 |
|------|------|------|
| id | String (cuid) | PK |
| name | String | unique 카테고리명 |
| icon | String? | 이모지 |
| color | String? | 색상 코드 |
| isSystem | Boolean | 시스템 기본값 여부 |

---

### Budget
월별 카테고리 예산.

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String | FK → User |
| categoryId | String | FK → Category |
| year / month | Int | 예산 연/월 |
| amount | Decimal(15,2) | 예산 금액 |

---

### AiReport
AI가 생성한 월별 소비 분석 리포트.

| 필드 | 타입 | 설명 |
|------|------|------|
| userId | String | FK → User |
| year / month | Int | 리포트 연/월 |
| content | String | AI 생성 텍스트 |

---

## 관계 요약

```
User
 ├── FinancialAccount[]   (은행/카드/현금 계좌)
 ├── Transaction[]        (거래 내역)
 ├── UploadedFile[]       (업로드 기록)
 ├── Budget[]             (예산)
 └── AiReport[]           (AI 리포트)

FinancialAccount
 └── Transaction[]        (해당 계좌의 거래들)

Transaction
 ├── FinancialAccount?    (어떤 계좌에서 발생했는지)
 └── Category?            (지출 카테고리)
```
