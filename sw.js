/* Cassiopeia PWA: кэш оболочки приложения; потоки и метаданные всегда мимо кэша. */
var CACHE = "csww-app-v2";
var ASSETS = ["./", "./index.html", "./manifest.webmanifest",
              "./icons/icon-192.png", "./icons/icon-512.png",
              "./icons/maskable-512.png", "./icons/apple-touch-icon.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(ASSETS); })
    .then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; })
      .map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener("fetch", function (e) {
  if (e.request.method !== "GET") return;
  var url = new URL(e.request.url);
  // аудиопотоки и статус Icecast никогда не кэшируем — только сеть
  if (url.pathname.endsWith("/stream") || url.pathname.endsWith(".xsl")) return;
  if (url.origin !== location.origin) return;
  e.respondWith(
    caches.match(e.request).then(function (hit) {
      return hit || fetch(e.request).then(function (resp) {
        if (resp.ok) {
          var copy = resp.clone();
          caches.open(CACHE).then(function (c) { c.put(e.request, copy); });
        }
        return resp;
      }).catch(function () {
        return caches.match("./index.html");
      });
    })
  );
});
