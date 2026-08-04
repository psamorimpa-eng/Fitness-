// Service Worker mínimo da Fase 1.
// Estratégia: shell e mídia em cache, dados sempre pela rede com fallback local.
const CACHE = "mff-v1";
const SHELL = ["/", "/inicio", "/treino", "/manifest.json"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== CACHE).map((k) => caches.delete(k)))));
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  const midia = /\.(png|jpg|jpeg|webp|svg|mp4|woff2)$/.test(url.pathname);

  if (midia) {
    e.respondWith(caches.match(req).then((r) => r || fetch(req).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia));
      return res;
    })));
    return;
  }

  e.respondWith(
    fetch(req).then((res) => {
      const copia = res.clone();
      caches.open(CACHE).then((c) => c.put(req, copia));
      return res;
    }).catch(() => caches.match(req).then((r) => r || caches.match("/inicio")))
  );
});
