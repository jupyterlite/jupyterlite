// eslint-disable-next-line @typescript-eslint/triple-slash-reference
/// <reference path="../../../node_modules/@types/serviceworker/index.d.ts" />

/**
 * The name of the cache
 */
const CACHE = 'precache';

/**
 * Communication channel for drive access
 */
const messagePorts: { [tabId: string]: MessagePort } = {};

/**
 * Whether to enable the cache
 */
let enableCache = false;

/**
 * Install event listeners
 */
self.addEventListener('install', onInstall);
self.addEventListener('activate', onActivate);
self.addEventListener('fetch', onFetch);
self.addEventListener('message', (event: ExtendableMessageEvent) => {
  if (event.data && event.data.type === 'INIT_PORT') {
    messagePorts[event.data.tabId] = event.ports[0];
  }
});

// Event handlers

/**
 * Handle installation with the cache
 */
function onInstall(event: ExtendableEvent): void {
  void self.skipWaiting();
  event.waitUntil(cacheAll());
}

/**
 * Handle activation.
 */
function onActivate(event: ExtendableEvent): void {
  // check if we should enable the cache
  const searchParams = new URL(location.href).searchParams;
  enableCache = searchParams.get('enableCache') === 'true';
  event.waitUntil(self.clients.claim());
}

/**
 * Handle fetching a single resource.
 */
async function onFetch(event: FetchEvent): Promise<void> {
  const { request } = event;

  const url = new URL(event.request.url);
  if (url.pathname === '/api/service-worker-heartbeat') {
    event.respondWith(new Response('ok'));
    return;
  }

  let responsePromise: Promise<Response> | null = null;
  if (isDriveRequest(url)) {
    responsePromise = requestMainThread(request);
  } else if (!shouldDrop(request, url)) {
    responsePromise = maybeFromCache(event);
  }

  if (responsePromise) {
    event.respondWith(responsePromise);
  }
}

// utilities

/** Get a cached response, and update cache. */
async function maybeFromCache(event: FetchEvent): Promise<Response> {
  const { request } = event;

  if (!enableCache) {
    return await fetch(request);
  }

  let response: Response | null = await fromCache(request);

  if (response) {
    event.waitUntil(refetch(request));
  } else {
    response = await fetch(request);
    event.waitUntil(updateCache(request, response.clone()));
  }

  return response;
}

/**
 * Restore a response from the cache based on the request.
 */
async function fromCache(request: Request): Promise<Response | null> {
  const cache = await openCache();
  const response = await cache.match(request);

  if (!response || response.status === 404) {
    return null;
  }

  return response;
}

/**
 * This is where we call the server to get the newest version of the
 * file to use the next time we show view
 */
async function refetch(request: Request): Promise<Response> {
  const fromServer = await fetch(request);
  await updateCache(request, fromServer);
  return fromServer;
}

/**
 * Whether a given URL should be broadcast
 */
function isDriveRequest(url: URL): boolean {
  return url.origin === location.origin && url.pathname.includes('/api/drive');
}

/**
 * Whether the fallback behavior should be used
 */
function shouldDrop(request: Request, url: URL): boolean {
  return (
    request.method !== 'GET' ||
    url.origin.match(/^http/) === null ||
    url.pathname.includes('/api/')
  );
}

/**
 * Forward request to main using the MessageChannel
 */
async function requestMainThread(request: Request): Promise<Response> {
  const message = await request.json();

  const tabId = message.tabId;

  const port = messagePorts[tabId];

  if (!port) {
    return new Response(JSON.stringify({ error: 'Port not initialized.' }));
  }

  const promise = new Promise<Response>((resolve) => {
    port.onmessage = (event) => {
      resolve(new Response(JSON.stringify(event.data)));
    };
  });

  port.postMessage(message.messageData);

  return await promise;
}

async function openCache(): Promise<Cache> {
  return await caches.open(CACHE);
}

/**
 * Cache a request/response pair.
 */
async function updateCache(request: Request, response: Response): Promise<void> {
  const cache = await openCache();
  return cache.put(request, response);
}

/**
 * Add all to the cache
 *
 * this is where we should (try to) add all relevant files
 */
async function cacheAll() {
  const cache = await openCache();
  return await cache.addAll([]);
}
