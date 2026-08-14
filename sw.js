const CACHE_NAME = 'sj-games-offline-v1';
// الملفات اللي هنخزنها عشان تشتغل أوفلاين
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './win.mp3' // الأغنية كمان هتتحفظ
];

// 1. تثبيت التطبيق وتخزين الملفات
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('تم فتح الكاش');
      return cache.addAll(ASSETS_TO_CACHE);
    }).catch(err => console.error('فشل التحميل:', err))
  );
  self.skipWaiting(); // تفعيل النسخة الجديدة فورًا
});

// 2. تنظيف النسخ القديمة عند التحديث
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('حذف الكاش القديم:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// 3. اعتراض الطلبات وجلبها من الكاش لو النت مقطوع
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      // لو لقينا نسخة محفوظة، نرجعها فورًا (سريع جدًا!)
      if (cachedResponse) {
        return cachedResponse;
      }
      // لو مش موجودة، نحاول نجيبها من النت
      return fetch(event.request).then((response) => {
        // لو الجواب ناجح، نخزن نسخة جديدة للمستقبل
        if (!response || response.status !== 200 || response.type !== 'basic') {
          return response;
        }
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });
        return response;
      }).catch(() => {
        // لو النت مقطوع تمامًا والصفحة مش في الكاش، نرجع الصفحة الرئيسية بدل صفحة الخطأ
        if (event.request.mode === 'navigate') {
          return caches.match('./index.html');
        }
      });
    })
  );
});
