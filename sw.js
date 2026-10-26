/* Minimal service worker: sirf PWA install ke liye.
   Kuchh cache nahi karta, isliye site ka purana behaviour (Firebase, YouTube, photos, chat) bilkul waisa hi rehta hai. */
self.addEventListener("install",function(){self.skipWaiting()});
self.addEventListener("activate",function(e){e.waitUntil(self.clients.claim())});
self.addEventListener("fetch",function(e){
  if(e.request.mode==="navigate"){e.respondWith(fetch(e.request))}
});
