/* eslint-env serviceworker */

// This is the service worker with the Cache-first network
const CACHE = 'precache';

const onInstall = event => {
  this.skipWaiting();

  event.waitUntil(
    caches.open(CACHE).then(cache => {
      // this is where we should (try to) add all relevant files
      return cache.addAll([]);
    })
  );
};

self.addEventListener('install', onInstall);

const onActivate = event => {
  event.waitUntil(this.clients.claim());
};

// Allow sw to control of current page
self.addEventListener('activate', onActivate);

const onFetch = event => {
  if (event.request.method !== 'GET' || event.request.url.match(/^http/) === null) {
    return;
  }
  if (event.request.url.match(/\.ipynb$/) !== null) {
    // this is a ipynb file. Try to return the content from y-indexeddb.
    // TODO()
    const response = new Response(null, { status: 404 });
    event.respondWith(response);
    return; // let the request fail
  }

  event.respondWith(
    fromCache(event.request).then(
      response => {
        // The response was found in the cache so we responde with it and update the entry
        // This is where we call the server to get the newest version of the
        // file to use the next time we show view
        event.waitUntil(
          fetch(event.request).then(response => {
            return updateCache(event.request, response);
          })
        );

        return response;
      },
      () => {
        // The response was not found in the cache so we look for it on the server
        return fetch(event.request).then(response => {
          // If request was success, add or update it in the cache
          event.waitUntil(updateCache(event.request, response.clone()));

          return response;
        });
      }
    )
  );
};

// If any fetch fails, it will look for the request in the cache and serve it from there first
self.addEventListener('fetch', onFetch);

function fromCache(request) {
  // Check to see if you have it in the cache
  // Return response
  // If not in the cache, then return
  return caches.open(CACHE).then(cache => {
    return cache.match(request).then(matching => {
      if (!matching || matching.status === 404) {
        return Promise.reject('no-match');
      }
      return matching;
    });
  });
}

function updateCache(request, response) {
  return caches.open(CACHE).then(cache => {
    return cache.put(request, response);
  });
}
