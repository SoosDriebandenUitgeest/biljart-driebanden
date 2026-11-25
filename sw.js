/* De SooS Driebanden - service worker
   Zorgt dat de app ook zonder bereik opent. Altijd eerst het
   netwerk (dus altijd de nieuwste versie); alleen als dat niet lukt
   de bewaarde kopie. De gegevens (data.json) bewaart de pagina zelf. */
"use strict";
const CACHE = "soos-v1";
const BASIS = ["./", "index.html", "manifest.webmanifest", "icon-192.png", "icon-512.png", "apple-touch-icon.png"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(BASIS)).catch(() => {}).then(() => self.skipWaiting()));
});

self.addEventListener("activate", e => {
  e.waitUntil(caches.keys()
    .then(k => Promise.all(k.filter(n => n !== CACHE).map(n => caches.delete(n))))
    .then(() => self.clients.claim()));
});

self.addEventListener("fetch", e => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  if (url.origin !== location.origin) return;
  // Gegevens en archief regelt de pagina zelf (met eigen opslag).
  if (/\/data\.json$/.test(url.pathname) || /\/archief\//.test(url.pathname)) return;

  e.respondWith(
    fetch(req).then(res => {
      if (res.ok) {
        const kopie = res.clone();
        caches.open(CACHE).then(c => c.put(req.mode === "navigate" ? "index.html" : req, kopie));
      }
      return res;
    }).catch(() =>
      caches.match(req.mode === "navigate" ? "index.html" : req, {ignoreSearch: true})
        .then(r => r || (req.mode === "navigate" ? caches.match("index.html") : Response.error())))
  );
});
