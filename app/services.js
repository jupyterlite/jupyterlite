const broadcast = new BroadcastChannel('filesystem');
let broadcastAnswerPromise;
let broadcastAnswerPromiseResolve;

self.addEventListener("install", (event) => {
    console.log('Install JupyterLite service v1');
    event.waitUntil(self.skipWaiting());
});

self.addEventListener('activate', (event) => {
    console.log('Activate JupyterLite service v1');
    event.waitUntil(self.clients.claim());
});

broadcast.onmessage = (event) => {
    console.log('Service Worker -- received back answer ', event);
    broadcastAnswerPromiseResolve(event);
};

self.addEventListener('fetch', async (event) => {
    const url = new URL(event.request.url);
    console.log('Service Worker -- Received ', url.pathname);

    // TODO Relying on the pathname only is weak
    // Bail early if the request is not a content request
    if (!url.pathname.startsWith('/api/drive')) {
        console.log('Service Worker -- Bail ');
        return;
    }

    console.log('Service Worker -- send request to main ', url);

    // If yes, send a filesystem broadcast message to the main thread, asking for the content
    broadcastAnswerPromise = new Promise((resolve) => {
        broadcastAnswerPromiseResolve = resolve;
    });
    broadcast.postMessage(url);
    const answer = await broadcastAnswerPromise;
    console.log('Service Worker -- sending back ', answer);
    event.respondWith(answer);
});
