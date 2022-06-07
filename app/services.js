const broadcast = new BroadcastChannel('/api/drive.v1');

self.addEventListener('install', (event) => {
  console.log('Install JupyterLite service v1');
  event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
  console.log('Activate JupyterLite service v1');
  event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event) => {
  const url = new URL(event.request.url);

  // Not same origin, we let the request continue
  if (url.origin !== location.origin) {
    return;
  }

  // Bail early if the request is not a drive content request
  if (!url.pathname.startsWith('/api/drive')) {
    return;
  }

  const method = new URLSearchParams(url.search).get('m');
  let args = new URLSearchParams(url.search).get('args');
  if (args !== null ) {
    args = args.split(',');
  }

  const messageData = {
    path: url.pathname,
    method,
    args
  };

  // Forward request to main using the broadcast channel
  event.respondWith(
    new Promise((resolve) => {
      broadcast.onmessage = (event) => {
        resolve(new Response(JSON.stringify(event.data)));
      };
      broadcast.postMessage(messageData);
    })
  );
});
