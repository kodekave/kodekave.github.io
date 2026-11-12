/* The Times Square map moved to https://mystery-maps.pages.dev/. This replaces the old offline service worker:
   it deletes the copy of the old map that was cached on visitors' devices, removes itself, and reloads open tabs
   so they reach the redirect page. Keep this file here; deleting it would leave old cached copies in place. */
self.addEventListener('install', function () { self.skipWaiting(); });
self.addEventListener('activate', function (e) {
  e.waitUntil(
    caches.keys()
      .then(function (keys) { return Promise.all(keys.filter(function (k) { return k.indexOf('tsmap') === 0; }).map(function (k) { return caches.delete(k); })); })
      .then(function () { return self.registration.unregister(); })
      .then(function () { return self.clients.matchAll({ type: 'window' }); })
      .then(function (clients) { clients.forEach(function (c) { c.navigate(c.url); }); })
  );
});
