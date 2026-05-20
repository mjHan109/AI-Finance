# API Reference

Base URL: `/api`

모든 보호된 엔드포인트는 로그인 세션 쿠키(`authjs.session-token`) 필요.

---

## Auth

### POST /api/auth/signup
회원가입.

**Request Body**
```json
{ "name": "홍길동", "email": "you@example.com", "password": "Pass1234!" }
```

**Response** `201`
```json
{ "ok": true }
```

**Errors**
- `400` 필수값 누락 또는 비밀번호 조건 미충족
- `409` 이미 가입된 이메일

---

## Accounts (금융 계좌)

### GET /api/accounts
내 계좌 목록 조회.

**Response** `200`
```json
[
  { "id": "...", "name": "국민은행 입출금", "type": "BANK", "color": null, "_count": { "transactions": 42 } }
]
```

### POST /api/accounts
새 계좌 등록.

**Request Body**
```json
{ "name": "신한카드", "type": "CARD", "color": "#8B5CF6" }
```

**type** 가능값: `BANK` | `CARD` | `CASH`

**Response** `201`
```json
{ "id": "...", "name": "신한카드", "type": "CARD" }
```

**Errors**
- `400` 필수값 누락 / 잘못된 type
- `409` 동일한 이름의 계좌 존재

### DELETE /api/accounts
계좌 삭제.

**Request Body**
```json
{ "id": "계좌id" }
```

---

## Upload

### POST /api/upload
거래 내역 파일 업로드. `multipart/form-data`.

**Form Fields**
| 필드 | 필수 | 설명 |
|------|------|------|
| file | ✅ | .xlsx / .xls / .csv, 최대 10MB |
| accountName | ❌ | 연결할 계좌 이름 |
| accountType | ❌ | BANK / CARD / CASH |

`accountName` + `accountType` 전달 시 해당 이름의 계좌를 upsert하고 거래에 연결.

**Response** `200`
```json
{
  "ok": true,
  "source": "kb",
  "total": 100,
  "saved": 87,
  "duplicates": 13,
  "errors": []
}
```

**source** 가능값: `kb` (KB국민은행) | `banksalad` (뱅크샐러드) | `generic`

**Errors**
- `400` 파일 없음
- `401` 미로그인
- `415` 허용되지 않는 파일 형식
- `422` 거래 내역 파싱 실패
