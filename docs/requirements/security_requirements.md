# Security Requirements

## Data in Transit
- HTTPS/TLS required for all API communication
- No sensitive data in query strings or URL parameters

## Data at Rest
- AES-256-GCM encryption for sensitive transaction fields
- Encryption keys stored in environment variables only
- Never hardcode secrets in source code or commit them to version control

## File Handling
- Delete uploaded source files from server after successful parsing
- Validate file type by MIME type and extension before processing
- Enforce file size limits on upload (max to be defined per environment)

## Authentication
- NextAuth.js with Google OAuth
- Session tokens stored securely (httpOnly cookies)
- Protect all API routes with session checks

## Privacy
- Users can request full deletion of their data
- No financial data shared with third parties
- AI API calls use normalized fields only — no raw file content sent externally

## Secrets Management
- All secrets (DB URL, API keys, OAuth credentials) stored in environment variables
- `.env` files excluded from version control via `.gitignore`
