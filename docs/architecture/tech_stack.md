# Technology Stack

## Frontend
- Next.js 15 (App Router)
- React
- TypeScript (strict mode)
- Tailwind CSS
- shadcn/ui

## Backend
- Next.js API Routes / Route Handlers only
- NestJS is excluded from MVP

## ORM & Database
- Prisma ORM
- PostgreSQL (hosted on Supabase)

## Authentication
- NextAuth.js
- Google OAuth (primary login method)

## AI
- Claude Sonnet (latest stable — claude-sonnet-4-6)
- Hybrid classification: Rule-based → Claude API fallback → User correction

## File Parsing
- SheetJS (XLSX/XLS)
- PapaParse (CSV)

## Visualization
- Recharts (MVP dashboard)

## Deployment
- Vercel (web app)
- Supabase (PostgreSQL)

## Security
- HTTPS/TLS (in transit)
- AES-256-GCM (sensitive data at rest)
- Secrets via environment variables only
