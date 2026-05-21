// Podo PWA Service Worker — minimal registration, no aggressive caching
// API routes are never cached to ensure financial data is always fresh.

const CACHE_NAME = "podo-static-v1";

// Only cache static shell assets
const STATIC_ASSETS = ["/", "/dashboard", "/offline.html"];

self.addEventListener("install", (event) => {
  // Skip waiting so the new SW activates immediately
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  // Clean up old caches on activation
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);

  // Never intercept API calls — always go to network for financial data
  if (url.pathname.startsWith("/api/")) {
    return;
  }

  // For all other requests, use network-first strategy (no aggressive caching)
  // This keeps the app functional while still registering as a PWA
});
