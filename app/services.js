const broadcast = new BroadcastChannel('/api/drive.v1');

self.addEventListener('install', (event) => {
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event) => {
  const url = new URL(event.request.url);

  // Not same origin, we let the request continue
  if (url.origin !== location.origin) {
    return;
  }

  // Bail early if the request is not a drive content request
  if (!url.pathname.includes('/api/drive')) {
    return;
  }

  // Forward request to main using the broadcast channel
  event.respondWith(
    new Promise(async (resolve) => {
      let path = decodeURI(url.pathname.slice(url.pathname.indexOf('/api/drive')));
      if (!path) {
        path = '';
      }

      const method = new URLSearchParams(url.search).get('m');
      let args = new URLSearchParams(url.search).get('args');
      if (args !== null) {
        args = args.split(',');
      }

      let content = '';
      if (event.request.method === 'PUT') {
        content = await event.request.text();
      }

      const messageData = {
        path,
        method,
        args,
        content,
      };

      broadcast.onmessage = (event) => {
        resolve(new Response(JSON.stringify(event.data)));
      };
      broadcast.postMessage(messageData);
    })
  );
});
