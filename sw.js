/* Purana minimal SW (PWA install ke liye: skipWaiting, clients.claim, navigate pe fetch) isi me shamil hai:
   install me skipWaiting, activate me clients.claim, aur navigate pe pehle fetch (net) hi chalta hai,
   cache sirf tab kaam aata hai jab net na ho.

   Hina's World service worker: app offline chalane ke liye cache karta hai.
   - App files (index.html, logo, manifest): network-first, net na ho to cache se.
   - Fonts, Firebase scripts, thumbnails, photos: pehli baar net se, phir cache me save.
   - YouTube API / OpenRouter / Firebase database ko kabhi cache nahi karta. */
var V = "hw-v1", IMG = "hw-img-v1";
var PRE = ["./", "index.html", "manifest.json", "logo.png?v=1.1"];
var PRE_X = [
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.12.2/firebase-database-compat.js",
  "https://fonts.googleapis.com/css2?family=Bangers&family=Fredoka:wght@500;700&display=swap"
];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) {
    var a = PRE.map(function (u) { return c.add(u).catch(function () {}); });
    var b = PRE_X.map(function (u) {
      return fetch(u, { mode: "no-cors" }).then(function (r) { return c.put(u, r); }).catch(function () {});
    });
    return Promise.all(a.concat(b));
  }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V && k !== IMG; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

function trim(name, max) {
  caches.open(name).then(function (c) {
    c.keys().then(function (ks) { if (ks.length > max) ks.slice(0, ks.length - max).forEach(function (k) { c.delete(k); }); });
  });
}

function swr(req, name, max) {
  return caches.open(name).then(function (c) {
    return c.match(req).then(function (hit) {
      var net = fetch(req).then(function (r) {
        if (r && (r.ok || r.type === "opaque")) { c.put(req, r.clone()); if (max) trim(name, max); }
        return r;
      }).catch(function () { return hit; });
      return hit || net;
    });
  });
}

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var u = new URL(req.url);

  if (req.mode === "navigate") {
    e.respondWith(
      new Promise(function (res) {
        var done = false;
        var fall = function () {
          caches.match("index.html").then(function (h) { return h || caches.match("./"); }).then(function (h) { if (!done) { done = true; res(h || Response.error()); } });
        };
        var t = setTimeout(fall, 5000);
        fetch(req).then(function (r) {
          clearTimeout(t);
          if (r && r.ok) { var cp = r.clone(); caches.open(V).then(function (c) { c.put("index.html", cp); }); }
          if (!done) { done = true; res(r); }
        }).catch(function () { clearTimeout(t); fall(); });
      })
    );
    return;
  }

  if (u.origin === self.location.origin) {
    e.respondWith(swr(req, V));
    return;
  }

  if (u.hostname === "i.ytimg.com" || u.hostname === "i.ibb.co") {
    e.respondWith(swr(req, IMG, 200));
    return;
  }
  if (u.hostname === "www.gstatic.com" || u.hostname === "fonts.gstatic.com" || u.hostname === "fonts.googleapis.com") {
    e.respondWith(swr(req, V));
    return;
  }
  /* baaki sab (YouTube API, OpenRouter, Firebase DB, youtube.com) seedha net se */
});
