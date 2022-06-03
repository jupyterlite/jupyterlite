const broadcast = new BroadcastChannel('/api/drive');

self.addEventListener("install", (event) => {
    console.log('Install JupyterLite service v1');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Activate JupyterLite service v1');
    event.waitUntil(self.clients.claim());
});

self.addEventListener('fetch', async (event) => {
    const url = new URL(event.request.url);

    // TODO Relying on the pathname only is weak
    // we should probably check that it's a same origin request

    // Bail early if the request is not a content request
    if (!url.pathname.startsWith('/api/drive')) {
        return;
    }

    console.log('Service Worker -- send request to main ', url.pathname);

    // Forward request to main using the broadcast channel
    event.respondWith(new Promise(resolve => {
        broadcast.onmessage = (event) => {
            console.log('Service Worker -- received answer from main', event.data);
            resolve(new Response(JSON.stringify(event.data)));
        };
        broadcast.postMessage(url.pathname);
    }));
});
