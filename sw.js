/* Cartoon Duniya: page ko offline kholne ke liye. index.html ke saath same folder me rakho. */
var C="cd-shell-v1";
self.addEventListener("install",function(e){
  e.waitUntil(caches.open(C).then(function(c){return c.addAll(["./","./index.html"]);}).then(function(){return self.skipWaiting();}));
});
self.addEventListener("activate",function(e){
  e.waitUntil(caches.keys().then(function(k){return Promise.all(k.filter(function(x){return x!==C;}).map(function(x){return caches.delete(x);}));}).then(function(){return self.clients.claim();}));
});
function keep(r,res){if(res&&(res.ok||res.type==="opaque")){var cp=res.clone();caches.open(C).then(function(c){c.put(r,cp);});}return res;}
self.addEventListener("fetch",function(e){
  var r=e.request;
  if(r.method!=="GET")return;
  var u=new URL(r.url);
  if(u.origin===location.origin){
    e.respondWith(fetch(r).then(function(res){return keep(r,res);}).catch(function(){
      return caches.match(r).then(function(m){return m||caches.match("./index.html")||Response.error();});
    }));
    return;
  }
  if(u.hostname==="fonts.googleapis.com"||u.hostname==="fonts.gstatic.com"){
    e.respondWith(caches.match(r).then(function(m){
      return m||fetch(r).then(function(res){return keep(r,res);}).catch(function(){return Response.error();});
    }));
  }
});
