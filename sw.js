// Trip Ledger offline cache. Bump VERSION when you upload a new index.html.
const VERSION = "tripledger-v7";
const CORE = ["./", "index.html", "manifest.webmanifest", "icon-180.png", "icon-192.png", "icon-512.png", "xlsx.mini.min.js"];
// Bill reader (on-device text recognition and PDF). Cached in the background so it works offline.
const EXTRA = ["ocr/tesseract.min.js", "ocr/worker.min.js", "ocr/core/tesseract-core-simd-lstm.wasm.js", "ocr/core/tesseract-core-lstm.wasm.js",
  "ocr/lang/eng.traineddata.gz", "pdf/pdf.min.js", "pdf/pdf.worker.min.js"];

self.addEventListener("install", e => {
  e.waitUntil(caches.open(VERSION).then(async c => {
    await c.addAll(CORE);
    await Promise.all(EXTRA.map(u => c.add(u).catch(() => {})));
  }).then(() => self.skipWaiting()));
});
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener("fetch", e => {
  if (e.request.method !== "GET" || new URL(e.request.url).origin !== self.location.origin) return;
  if (e.request.mode === "navigate") {
    e.respondWith(fetch(e.request).then(r => { const copy = r.clone(); caches.open(VERSION).then(c => c.put("index.html", copy)); return r; })
      .catch(() => caches.match("index.html")));
    return;
  }
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(r => {
    if (r.ok) { const copy = r.clone(); caches.open(VERSION).then(c => c.put(e.request, copy)); }
    return r;
  })));
});
