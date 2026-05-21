# Mobile UX Review — PWA Phase 1

Review Date: 2026-05-21
Branch: feature/pwa

---

## Summary

Overall mobile layout is functional. Bottom navigation, dashboard, and upload pages are usable.
Three categories of issues found: Safe Area (fixed), Overflow/Scroll (partially fixed), and Installability (known limitations).

---

## Issues Found & Status

### 1. Safe Area — iPhone Notch / Home Indicator

**Severity:** High — content blocked by iPhone home indicator in standalone PWA mode

| Issue | File | Fix Applied |
|-------|------|-------------|
| `viewport-fit=cover` missing | `src/app/layout.tsx` | ✅ Added via metadata.viewport |
| `apple-mobile-web-app-capable` missing | `src/app/layout.tsx` | ✅ Added via metadata.appleWebApp |
| Bottom nav has no `safe-area-inset-bottom` | `src/app/dashboard/layout.tsx` | ✅ Added via inline style |
| Main content `pb-16` doesn't include safe area | `src/app/dashboard/layout.tsx` | ✅ Changed to `pb-[calc(4rem+env(safe-area-inset-bottom))]` |
| TransactionDetailModal has no bottom padding | `src/components/TransactionDetailModal.tsx` | ✅ Added `paddingBottom: env(safe-area-inset-bottom)` |

---

### 2. Modal Overflow

**Severity:** Medium — modal may exceed screen height on small phones (iPhone SE, Galaxy A series)

| Issue | File | Fix Applied |
|-------|------|-------------|
| Modal has no `max-height` constraint | `TransactionDetailModal.tsx` | ✅ Added `max-h-[85dvh]` (uses `dvh` for browser chrome awareness) |
| Modal content has no scroll fallback | `TransactionDetailModal.tsx` | ✅ Added `overflow-y-auto` to content div |

---

### 3. Horizontal Scroll (Observed, No Fix Needed)

| Issue | File | Assessment |
|-------|------|------------|
| Category filter uses `overflow-x-auto scrollbar-hide` | `dashboard/transactions/page.tsx` | Acceptable — iOS momentum scroll works without explicit `-webkit-overflow-scrolling` in modern Safari |

---

### 4. Upload Page

| Issue | Assessment |
|-------|------------|
| `py-12` may be excessive on small screens | Low risk — no fixed bottom nav on upload page, scrollable |
| No "back to dashboard" button visible in PWA standalone mode | Minor — ArrowLeft link is present but easy to miss |

---

## PWA Installability Checklist

| Criterion | Status | Notes |
|-----------|--------|-------|
| HTTPS | ✅ Vercel provides HTTPS | Required for SW registration |
| Web App Manifest | ✅ `src/app/manifest.ts` | `/manifest.webmanifest` detected in build |
| Service Worker registered | ✅ `public/sw.js` + `ServiceWorkerRegister` | Basic registration only |
| Icons 192x192 | ✅ `public/icons/icon-192.png` | Placeholder — needs real design |
| Icons 512x512 | ✅ `public/icons/icon-512.png` | Placeholder — needs real design |
| `start_url` | ✅ `/dashboard` | |
| `display: standalone` | ✅ | |
| viewport-fit=cover | ✅ Fixed | Was missing |
| apple-mobile-web-app-capable | ✅ Fixed | Was missing |

---

## Remaining PWA Limitations

1. **No offline support** — intentional for Phase 1. Financial data must always be fresh.
2. **No push notifications** — not implemented. Requires VAPID keys + DB subscription storage.
3. **App Store deployment** — not possible as PWA. Requires Phase 3 React Native (Expo).
4. **iOS Safari install UX** — no `beforeinstallprompt` (Safari doesn't support it). User must manually use Share → Add to Home Screen.
5. **Icons are placeholder PNGs** — generated programmatically. Replace with proper branded icons before production.
6. **Status bar on iOS** — set to `black-translucent`. May need to be adjusted based on actual app color scheme.
7. **SW scope** — currently handles no caching. Lighthouse PWA audit may flag "does not respond while offline."

---

## Recommended Next Steps

- Replace placeholder icons with proper 192×512 branded icons
- Test on real iPhone (Safari) and Android Chrome for install prompt
- Run Lighthouse PWA audit after Vercel deploy
- Consider `offline.html` fallback page for Lighthouse score (does not affect app functionality)
