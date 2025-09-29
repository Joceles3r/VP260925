// Path: public/sw.js (minimal offline shell)
self.addEventListener('install', (e)=>{
  e.waitUntil(caches.open('visual-v1').then(cache=>cache.addAll(['/','/offline'])));
});
self.addEventListener('fetch', (e)=>{
  e.respondWith(fetch(e.request).catch(()=>caches.match('/offline')));
});
