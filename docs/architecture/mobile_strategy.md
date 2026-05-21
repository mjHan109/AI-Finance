# Status

Current Phase: PWA Preparation
Mobile App Status: Planned
React Native Status: Not Started

# Mobile App Transition Strategy

## Summary

The project will transition gradually in the following order:

Web Application → PWA → API Stabilization → React Native Mobile App

PostgreSQL, Supabase, and Prisma will remain unchanged across all phases.

The mobile application must never connect directly to PostgreSQL.
All mobile traffic must go through the existing Next.js `/api/*` routes.

---

# Infrastructure Architecture

The backend architecture will remain unchanged.

```text
[Web Browser / React Native App]
                ↓
      Next.js API Routes (/api/*)
                ↓
              Prisma
                ↓
    Supabase PostgreSQL
```

---

# Phase Plan

## Phase 1 — PWA Integration

### Goal

Convert the existing Next.js web application into an installable Progressive Web App with minimal code changes.

### Repository Strategy

Use the existing web repository and a short-lived feature branch.

```text
main
└── feature/pwa
```

### Tasks

* Install and configure `next-pwa`
* Add `manifest.json`
* Configure app icons and theme colors
* Configure Service Worker caching
* Improve mobile viewport and touch UX
* Verify "Add to Home Screen" support

### Benefits

* Minimal code changes
* Existing Vercel deployment remains unchanged
* Installable on Android/iOS home screens

### Limitations

* No App Store deployment
* Limited device API access

---

## Phase 2 — API Stabilization

### Goal

Prepare APIs for reuse by external mobile clients.

### Repository Strategy

Continue using the existing web repository.

```text
main
└── feature/api-standardization
```

### Tasks

* Standardize API response formats
* Standardize error response formats
* Review environment variables
* Review CORS configuration
* Improve API documentation
* Evaluate authentication strategy for mobile clients

### Recommended API Response Format

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

### Environment Variables

```text
NEXTAUTH_URL
AUTH_SECRET
GOOGLE_CLIENT_ID
GOOGLE_CLIENT_SECRET
DATABASE_URL
DIRECT_URL
ANTHROPIC_API_KEY
NEXT_PUBLIC_API_BASE_URL
```

---

## Phase 3 — React Native (Expo) Application

### Goal

Create a dedicated native mobile application while reusing the existing backend APIs.

### Repository Strategy

React Native should NOT be added to the current web repository.

Recommended structure:

```text
podo-web
podo-mobile
```

Future monorepo migration can be considered later if needed.

### Mobile App Architecture

```text
podo-mobile
        ↓
https://podo-web.vercel.app/api/*
        ↓
      Prisma
        ↓
Supabase PostgreSQL
```

### Important Rule

The mobile app must NEVER connect directly to PostgreSQL or Supabase database tables.

All database access must go through the existing backend API layer.

### Tasks

* Create Expo project
* Implement API client module
* Implement mobile authentication flow
* Implement file upload UX
* Prepare App Store deployment

---

# Authentication Strategy

## Phase 1 (PWA)

Continue using the current NextAuth implementation.

## Phase 3 (React Native)

Re-evaluate authentication strategy.

Possible options:

### Option 1 — Reuse Existing NextAuth APIs

* Minimal backend changes
* Cookie handling may become complicated

### Option 2 — Migrate to Supabase Auth

* Better long-term app/web integration
* Simpler mobile authentication flow

### Option 3 — Custom JWT APIs

* Separate `/api/mobile/*` auth endpoints
* Full control over mobile authentication

### Recommendation

Do NOT redesign authentication yet.
Re-evaluate when React Native development begins.

---

# File Upload Strategy

## Web

Current upload flow remains unchanged.

## Mobile

Use Expo plugins:

```text
expo-document-picker
expo-image-picker
```

Existing `/api/upload` endpoint can be reused.

The mobile app should continue using multipart/form-data uploads.

---

# CORS Strategy

## Web

No issues because requests use the same domain.

## Mobile

External mobile clients may require:

* CORS adjustments
* Token-based authentication
* Mobile-specific API endpoints

Possible future endpoints:

```text
/api/mobile/auth
/api/mobile/upload
/api/mobile/transactions
```

This is NOT required during Phase 1 or Phase 2.

---

# Items That Do NOT Need Changes

The following infrastructure can remain unchanged:

* PostgreSQL
* Supabase
* Prisma schema
* Existing `/api/*` routes
* Vercel deployment

---

# Recommended Branch Strategy

```text
main
  Stable production branch

feature/pwa
  PWA integration

feature/api-standardization
  API stabilization for mobile reuse

feature/mobile-readiness
  Mobile preparation tasks
```

React Native development should happen in a separate repository:

```text
podo-mobile
```

---

# Important Notes

Adding React Native directly into the current Next.js repository too early may cause:

* Dependency conflicts
* Build pipeline complexity
* Web/mobile code confusion
* Deployment issues
* Increased AI agent confusion

Recommended approach:

1. Stabilize the current web application
2. Add PWA support
3. Stabilize APIs
4. Start a separate Expo repository for mobile development

This approach minimizes risk while maximizing code reuse.
