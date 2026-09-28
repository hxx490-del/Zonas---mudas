const CACHE = "zona-mudas-v3";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).catch(()=>{}));
  self.skipWaiting();
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// A página (o HTML) vai sempre buscar a versão mais recente à rede primeiro;
// só usa a cópia guardada se não houver internet nesse momento.
// Os outros ficheiros (ícones, manifest) usam a cópia guardada primeiro, por serem
// mais pesados e quase nunca mudarem.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;

  const isPage = e.request.mode === "navigate" || e.request.url.endsWith("index.html") || e.request.url.endsWith("/");

  if (isPage) {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => caches.match(e.request))
    );
    return;
  }

  e.respondWith(
    caches.match(e.request).then((cached) => {
      const network = fetch(e.request)
        .then((res) => {
          if (res && res.ok) {
            const copy = res.clone();
            caches.open(CACHE).then((c) => c.put(e.request, copy));
          }
          return res;
        })
        .catch(() => cached);
      return cached || network;
    })
  );
});
