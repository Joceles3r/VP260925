/**
 * Service Worker pour VISUAL Platform PWA
 * Gestion du cache, synchronisation offline et notifications push
 */

const CACHE_NAME = 'visual-platform-v1.2.0';
const RUNTIME_CACHE = 'visual-runtime-v1.2.0';
const API_CACHE = 'visual-api-v1.2.0';

// Ressources critiques à mettre en cache immédiatement
const CRITICAL_RESOURCES = [
  '/',
  '/visual',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
  // Ajout des assets CSS/JS critiques sera fait dynamiquement
];

// Stratégies de cache par type de ressource
const CACHE_STRATEGIES = {
  // Pages HTML - Network First avec fallback cache
  pages: 'network-first',
  
  // API - Cache First avec revalidation
  api: 'cache-first',
  
  // Assets statiques - Cache First
  static: 'cache-first',
  
  // Images - Cache First avec cleanup
  images: 'cache-first',
};

// ===== INSTALLATION =====
self.addEventListener('install', (event) => {
  console.log('[SW] Installation démarrée');
  
  event.waitUntil(
    (async () => {
      try {
        // Ouvrir le cache principal
        const cache = await caches.open(CACHE_NAME);
        
        // Mettre en cache les ressources critiques
        await cache.addAll(CRITICAL_RESOURCES);
        
        console.log('[SW] Ressources critiques mises en cache');
        
        // Forcer l'activation immédiate
        await self.skipWaiting();
        
      } catch (error) {
        console.error('[SW] Erreur installation:', error);
      }
    })()
  );
});

// ===== ACTIVATION =====
self.addEventListener('activate', (event) => {
  console.log('[SW] Activation démarrée');
  
  event.waitUntil(
    (async () => {
      try {
        // Nettoyer les anciens caches
        const cacheNames = await caches.keys();
        const oldCaches = cacheNames.filter(name => 
          name.startsWith('visual-') && 
          name !== CACHE_NAME && 
          name !== RUNTIME_CACHE && 
          name !== API_CACHE
        );
        
        await Promise.all(
          oldCaches.map(cacheName => caches.delete(cacheName))
        );
        
        console.log('[SW] Anciens caches nettoyés:', oldCaches);
        
        // Prendre le contrôle immédiatement
        await self.clients.claim();
        
      } catch (error) {
        console.error('[SW] Erreur activation:', error);
      }
    })()
  );
});

// ===== INTERCEPTION DES REQUÊTES =====
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  
  // Ignorer les requêtes non-HTTP et les websockets
  if (!request.url.startsWith('http') || url.pathname.includes('_next/webpack')) {
    return;
  }
  
  // Stratégie selon le type de ressource
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(handleAPIRequest(request));
  } else if (isPageRequest(request)) {
    event.respondWith(handlePageRequest(request));
  } else if (isStaticAsset(request)) {
    event.respondWith(handleStaticAsset(request));
  } else if (isImageRequest(request)) {
    event.respondWith(handleImageRequest(request));
  } else {
    event.respondWith(handleGenericRequest(request));
  }
});

// ===== STRATÉGIES DE CACHE =====

/**
 * Gestion des requêtes API - Cache First avec revalidation
 */
async function handleAPIRequest(request) {
  const cacheName = API_CACHE;
  
  try {
    // Essayer le cache d'abord
    const cache = await caches.open(cacheName);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      // Revalidation en arrière-plan pour les GET
      if (request.method === 'GET') {
        fetch(request)
          .then(response => {
            if (response.ok) {
              cache.put(request, response.clone());
            }
          })
          .catch(() => {
            // Ignore les erreurs de revalidation
          });
      }
      
      return cachedResponse;
    }
    
    // Pas en cache, faire la requête réseau
    const networkResponse = await fetch(request);
    
    // Mettre en cache les réponses GET réussies
    if (request.method === 'GET' && networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Erreur requête API:', error);
    
    // Fallback pour les erreurs réseau
    return new Response(
      JSON.stringify({ 
        error: 'Service temporairement indisponible',
        offline: true 
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

/**
 * Gestion des pages - Network First avec fallback cache
 */
async function handlePageRequest(request) {
  try {
    // Essayer le réseau d'abord
    const networkResponse = await fetch(request);
    
    if (networkResponse.ok) {
      // Mettre en cache la page
      const cache = await caches.open(RUNTIME_CACHE);
      cache.put(request, networkResponse.clone());
      return networkResponse;
    }
    
    throw new Error('Network response not ok');
    
  } catch (error) {
    // Fallback vers le cache
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Fallback vers la page d'accueil en cache
    const fallbackResponse = await cache.match('/');
    if (fallbackResponse) {
      return fallbackResponse;
    }
    
    // Dernière option: page offline
    return createOfflinePage();
  }
}

/**
 * Gestion des assets statiques - Cache First
 */
async function handleStaticAsset(request) {
  const cache = await caches.open(CACHE_NAME);
  
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    console.error('[SW] Erreur asset statique:', error);
    
    // Fallback pour les assets critiques
    if (request.url.includes('icon')) {
      const fallbackIcon = await cache.match('/icons/icon-192x192.png');
      if (fallbackIcon) return fallbackIcon;
    }
    
    return new Response('Asset non disponible', { status: 404 });
  }
}

/**
 * Gestion des images - Cache First avec cleanup
 */
async function handleImageRequest(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  
  try {
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Limiter la taille du cache des images
      await limitCacheSize(RUNTIME_CACHE, 50); // Max 50 images
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
    
  } catch (error) {
    // Fallback vers une image placeholder
    return createPlaceholderImage();
  }
}

/**
 * Gestion générique - Network First
 */
async function handleGenericRequest(request) {
  try {
    return await fetch(request);
  } catch (error) {
    const cache = await caches.open(RUNTIME_CACHE);
    const cachedResponse = await cache.match(request);
    return cachedResponse || new Response('Ressource non disponible', { status: 404 });
  }
}

// ===== UTILITAIRES =====

/**
 * Détermine si c'est une requête de page
 */
function isPageRequest(request) {
  return request.method === 'GET' && 
         request.headers.get('accept')?.includes('text/html');
}

/**
 * Détermine si c'est un asset statique
 */
function isStaticAsset(request) {
  const url = new URL(request.url);
  return /\.(css|js|woff2?|ttf|ico)$/i.test(url.pathname);
}

/**
 * Détermine si c'est une image
 */
function isImageRequest(request) {
  const url = new URL(request.url);
  return /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(url.pathname);
}

/**
 * Limite la taille d'un cache
 */
async function limitCacheSize(cacheName, maxItems) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  
  if (keys.length > maxItems) {
    const keysToDelete = keys.slice(0, keys.length - maxItems);
    await Promise.all(keysToDelete.map(key => cache.delete(key)));
  }
}

/**
 * Crée une page offline
 */
function createOfflinePage() {
  const html = `
    <!DOCTYPE html>
    <html lang="fr">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>VISUAL - Mode Hors Ligne</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          background: linear-gradient(135deg, #0F0F23 0%, #1A1A2E 100%);
          color: #00D1FF;
          margin: 0;
          padding: 2rem;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          text-align: center;
        }
        .logo {
          font-size: 3rem;
          font-weight: bold;
          margin-bottom: 1rem;
          background: linear-gradient(45deg, #00D1FF, #7B2CFF);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        .message {
          font-size: 1.2rem;
          margin-bottom: 2rem;
          opacity: 0.8;
        }
        .retry-btn {
          background: linear-gradient(45deg, #00D1FF, #7B2CFF);
          border: none;
          padding: 1rem 2rem;
          border-radius: 0.5rem;
          color: white;
          font-size: 1rem;
          cursor: pointer;
          transition: transform 0.2s;
        }
        .retry-btn:hover {
          transform: scale(1.05);
        }
      </style>
    </head>
    <body>
      <div class="logo">VISUAL</div>
      <div class="message">
        Vous êtes actuellement hors ligne.<br>
        Veuillez vérifier votre connexion internet.
      </div>
      <button class="retry-btn" onclick="window.location.reload()">
        Réessayer
      </button>
    </body>
    </html>
  `;
  
  return new Response(html, {
    headers: { 'Content-Type': 'text/html' }
  });
}

/**
 * Crée une image placeholder
 */
function createPlaceholderImage() {
  // SVG simple comme placeholder
  const svg = `
    <svg width="200" height="200" xmlns="http://www.w3.org/2000/svg">
      <rect width="200" height="200" fill="#1A1A2E"/>
      <text x="100" y="100" font-family="Arial" font-size="16" fill="#00D1FF" text-anchor="middle" dy="0.3em">
        Image non disponible
      </text>
    </svg>
  `;
  
  return new Response(svg, {
    headers: { 'Content-Type': 'image/svg+xml' }
  });
}

// ===== GESTION DES NOTIFICATIONS PUSH =====
self.addEventListener('push', (event) => {
  console.log('[SW] Notification push reçue');
  
  const options = {
    body: 'Nouveau contenu disponible sur VISUAL Platform',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-72x72.png',
    tag: 'visual-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'view',
        title: 'Voir',
        icon: '/icons/action-view.png'
      },
      {
        action: 'dismiss',
        title: 'Ignorer'
      }
    ],
    data: {
      timestamp: Date.now(),
      url: '/'
    }
  };
  
  if (event.data) {
    try {
      const payload = event.data.json();
      Object.assign(options, payload);
    } catch (error) {
      console.error('[SW] Erreur parsing notification:', error);
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('VISUAL Platform', options)
  );
});

// ===== GESTION DES CLICS SUR NOTIFICATIONS =====
self.addEventListener('notificationclick', (event) => {
  console.log('[SW] Clic sur notification:', event.action);
  
  event.notification.close();
  
  if (event.action === 'dismiss') {
    return;
  }
  
  const urlToOpen = event.notification.data?.url || '/';
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true })
      .then((clientList) => {
        // Chercher un onglet VISUAL existant
        for (const client of clientList) {
          if (client.url.includes(self.location.origin)) {
            client.focus();
            client.navigate(urlToOpen);
            return;
          }
        }
        
        // Ouvrir un nouvel onglet
        clients.openWindow(urlToOpen);
      })
  );
});

// ===== SYNCHRONISATION EN ARRIÈRE-PLAN =====
self.addEventListener('sync', (event) => {
  console.log('[SW] Synchronisation:', event.tag);
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync());
  }
});

async function doBackgroundSync() {
  try {
    // Synchroniser les données offline
    console.log('[SW] Synchronisation des données offline...');
    
    // TODO: Implémenter la synchronisation réelle
    // - Envoyer les actions en attente
    // - Récupérer les nouvelles données
    // - Mettre à jour les caches
    
  } catch (error) {
    console.error('[SW] Erreur synchronisation:', error);
  }
}

// ===== GESTION DES MESSAGES =====
self.addEventListener('message', (event) => {
  if (event.data && event.data.type) {
    switch (event.data.type) {
      case 'SKIP_WAITING':
        self.skipWaiting();
        break;
        
      case 'GET_CACHE_SIZE':
        getCacheSize().then(size => {
          event.ports[0].postMessage({ size });
        });
        break;
        
      case 'CLEAR_CACHE':
        clearAllCaches().then(() => {
          event.ports[0].postMessage({ cleared: true });
        });
        break;
    }
  }
});

async function getCacheSize() {
  const cacheNames = await caches.keys();
  let totalSize = 0;
  
  for (const cacheName of cacheNames) {
    if (cacheName.startsWith('visual-')) {
      const cache = await caches.open(cacheName);
      const keys = await cache.keys();
      totalSize += keys.length;
    }
  }
  
  return totalSize;
}

async function clearAllCaches() {
  const cacheNames = await caches.keys();
  const visualCaches = cacheNames.filter(name => name.startsWith('visual-'));
  
  await Promise.all(
    visualCaches.map(cacheName => caches.delete(cacheName))
  );
}

console.log('[SW] Service Worker VISUAL Platform initialisé');