const CACHE_NAME = 'classroom-reminder-v1';
const urlsToCache = [
  '/classroom-reminder/',
  '/classroom-reminder/index.html',
  '/classroom-reminder/styles.css',
  '/classroom-reminder/script.js',
];

// Install Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching files');
        return cache.addAll(urlsToCache);
      })
      .catch((err) => console.log('Cache failed:', err))
  );
});

// Activate Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cache) => {
          if (cache !== CACHE_NAME) {
            console.log('Service Worker: Clearing old cache');
            return caches.delete(cache);
          }
        })
      );
    })
  );
  return self.clients.claim();
});

// Fetch Event - Network first, then cache
self.addEventListener('fetch', (event) => {
  if (event.request.url.includes('googleapis.com')) {
    // Always fetch Google API requests from network
    event.respondWith(fetch(event.request));
  } else {
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Clone the response
          const responseClone = response.clone();
          // Cache the fetched response
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // If fetch fails, try cache
          return caches.match(event.request);
        })
    );
  }
});

// Background Sync for syncing assignments
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-assignments') {
    console.log('Background sync: Syncing assignments');
    event.waitUntil(syncAssignments());
  }
});

async function syncAssignments() {
  // This would sync assignments in the background
  // For now, just log it
  console.log('Syncing assignments in background...');
  return Promise.resolve();
}

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  // Open the app when notification is clicked
  event.waitUntil(
    clients.openWindow('/')
  );
});

// Push notifications (for future implementation)
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'You have a new reminder!',
    icon: '/icon-192.png',
    badge: '/icon-192.png',
    vibrate: [200, 100, 200],
    tag: 'classroom-reminder',
    requireInteraction: true
  };
  
  event.waitUntil(
    self.registration.showNotification('Classroom Reminder', options)
  );
});
