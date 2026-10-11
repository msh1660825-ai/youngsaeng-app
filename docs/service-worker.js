const CACHE_NAME = 'youngsaeng-web-20261011b';
const PRECACHE_URLS = ['./', 'manifest.json', 'icon-192.png', 'icon-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', (event) => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(PRECACHE_URLS.map((url) => cache.add(url).catch(() => {})))
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// 문서(HTML) 자체는 "네트워크 우선"으로 바꿔서, 업데이트를 배포한 뒤 새로고침하면
// 바로 최신 화면이 보이도록 한다(예전에는 캐시를 먼저 보여주고 다음 방문에야
// 갱신되는 방식이라 "배포했는데 아직도 옛날 화면"으로 보이는 문제가 있었음).
// 오프라인일 때만 캐시로 대체한다. 그 외 정적 자원(아이콘 등)은 기존처럼
// 캐시 우선 + 백그라운드 갱신을 유지해 오프라인 동작을 보장한다.
self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  const isNavigation = event.request.mode === 'navigate' ||
    (event.request.destination === 'document');

  if (isNavigation) {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          if (response && response.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, response.clone()));
          }
          return response;
        })
        .catch(() => caches.open(CACHE_NAME).then((cache) => cache.match(event.request)))
    );
    return;
  }

  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const network = fetch(event.request)
          .then((response) => {
            if (response && response.status === 200) {
              cache.put(event.request, response.clone());
            }
            return response;
          })
          .catch(() => cached);
        return cached || network;
      })
    )
  );
});
