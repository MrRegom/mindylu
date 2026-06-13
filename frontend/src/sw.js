import { precacheAndRoute } from 'workbox-precaching';

// Precarga todos los assets que Vite PWA inyectará aquí
precacheAndRoute(self.__WB_MANIFEST);

// Escuchar eventos push
self.addEventListener('push', function (event) {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: '/pwa-192x192.png',
      badge: '/pwa-192x192.png',
      vibrate: [200, 100, 200, 100, 200, 100, 200], // Vibración fuerte para notificaciones de ventas
      data: data.data || { url: '/' },
      requireInteraction: true // Para que no desaparezca sola
    };
    
    event.waitUntil(
      self.registration.showNotification(data.title, options)
    );
  }
});

// Al hacer clic en la notificación, abrir la app o ponerla en foco
self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  const targetUrl = event.notification.data.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(windowClients => {
      // Si la app ya está abierta, hacerle foco y navegar a la URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if ('focus' in client) {
          client.navigate(targetUrl);
          return client.focus();
        }
      }
      // Si no, abrir una nueva ventana
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
