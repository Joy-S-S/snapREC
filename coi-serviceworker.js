/*! coi-serviceworker v0.1.7 | MIT License | https://github.com/gzuidhof/coi-serviceworker */
const CACHE_NAME = "snaprec-python-engine-v1";
const ASSETS_TO_CACHE = [
    "https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js",
    "https://unpkg.com/@ffmpeg/ffmpeg@0.11.0/dist/ffmpeg.min.js",
    "https://unpkg.com/fix-webm-duration@1.0.5/fix-webm-duration.min.js"
];

if (typeof window === 'undefined') {
    self.addEventListener("install", (event) => {
        self.skipWaiting();
        event.waitUntil(
            caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS_TO_CACHE))
        );
    });

    self.addEventListener("activate", (event) => event.waitUntil(self.clients.claim()));

    self.addEventListener("fetch", (event) => {
        event.respondWith(
            caches.match(event.request).then((cachedResponse) => {
                const networkFetch = fetch(event.request).then((response) => {
                    if (response.status === 0) return response;

                    // Inject COOP/COEP Headers
                    const newHeaders = new Headers(response.headers);
                    newHeaders.set("Cross-Origin-Embedder-Policy", "require-corp");
                    newHeaders.set("Cross-Origin-Opener-Policy", "same-origin");

                    const clonedResponse = new Response(response.body, {
                        status: response.status,
                        statusText: response.statusText,
                        headers: newHeaders,
                    });

                    // Update cache for these specific assets
                    if (ASSETS_TO_CACHE.some(url => event.request.url.includes(url))) {
                        const responseToCache = clonedResponse.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    }

                    return clonedResponse;
                }).catch((e) => console.error(e));

                return cachedResponse || networkFetch;
            })
        );
    });
} else {
    // Client-side initialization
    if (window.crossOriginIsolated === false) {
        navigator.serviceWorker.register("coi-serviceworker.js").then(registration => {
            registration.addEventListener("updatefound", () => location.reload());
            if (registration.active) location.reload();
        });
    }
}
