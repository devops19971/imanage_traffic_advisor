// public/sw.js
// Service Worker for background traffic polling and push notifications

const CACHE_NAME = 'imanage-traffic-advisor-v1'

self.addEventListener('install', (event) => {
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim())
})

// Listen for messages from the main page
self.addEventListener('message', (event) => {
  if (event.data?.type === 'PING') {
    event.ports[0]?.postMessage({ type: 'PONG' })
  }
})

// Handle push notifications (for future server-side push support)
self.addEventListener('push', (event) => {
  const data = event.data?.json() || {}
  event.waitUntil(
    self.registration.showNotification(data.title || '🚦 iManage Traffic Advisor', {
      body: data.body || 'Traffic update available.',
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: 'traffic-update',
      renotify: true,
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  event.waitUntil(
    self.clients.matchAll({ type: 'window' }).then((clients) => {
      if (clients.length > 0) return clients[0].focus()
      return self.clients.openWindow('/')
    })
  )
})
