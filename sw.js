const VERSION = "3.11.0";
const CACHE_PREFIX = "volleyball-trainer-shell-";
const CACHE_NAME = `${CACHE_PREFIX}${VERSION}`;
const OFFLINE_MUSIC_CACHE = "vb-training-music-v1";
const VOICE_ASSETS = ["kerstin","thorsten"].map(name => `./assets/audio/voice-de-${name}/voice.mp3`);
const CUSTOM_VOICE_ASSETS = ["b","c"].flatMap(pack => ["three","two","one","and","work","pause","action","continue","change","next-station"].map(name => `./assets/audio/voice-custom-${pack}/${name}.mp3`));
const APP_SHELL = [
  "./index.html",
  `./style.css?v=${VERSION}`,
  `./vendor/tone-15.1.22.js?v=${VERSION}`,
  `./music-library.js?v=${VERSION}`,
  `./training-player.js?v=${VERSION}`,
  `./app.js?v=${VERSION}`,
  `./config.js?v=${VERSION}`,
  `./manifest.webmanifest?v=${VERSION}`,
  `./assets/ttc-logo.png?v=${VERSION}`,
  `./assets/apple-touch-icon.png?v=${VERSION}`,
  `./assets/icon-192.png?v=${VERSION}`,
  `./assets/icon-512.png?v=${VERSION}`,
  "./assets/audio/kick.wav",
  "./assets/audio/snare.wav",
  "./assets/audio/hat-closed.wav",
  "./assets/audio/hat-open.wav",
  "./assets/audio/bass-c2.wav",
  "./assets/audio/bass-c3.wav",
  "./assets/audio/LICENSE.md",
  "./assets/audio/voice-de-kerstin/LICENSE.md",
  "./assets/audio/voice-de-thorsten/LICENSE.md",
  "./assets/audio/voice-custom-b/README.md",
  "./assets/audio/voice-custom-c/README.md",
  "./assets/music/ronald-kah/LICENSE.md",
  ...VOICE_ASSETS,
  ...CUSTOM_VOICE_ASSETS
];
const absoluteUrl = path => new URL(path, self.registration.scope).href;
const INDEX_URL = absoluteUrl("./index.html");
const VERSION_URL = absoluteUrl("./version.json");
const APP_SHELL_URLS = new Set(APP_SHELL.map(absoluteUrl));

self.addEventListener("install", event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    await Promise.all(APP_SHELL.map(async path => {
      const request = new Request(absoluteUrl(path), { cache: "reload" });
      const response = await fetch(request);
      if (!response.ok) throw new Error(`App-Datei konnte nicht geladen werden: ${path}`);
      await cache.put(request, response);
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter(key => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
      .map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (url.pathname === new URL(VERSION_URL).pathname) {
    event.respondWith(fetch(request));
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        const response = await fetch(request);
        if (response.ok) {
          const cache = await caches.open(CACHE_NAME);
          await cache.put(INDEX_URL, response.clone());
        }
        return response;
      } catch {
        return (await caches.match(INDEX_URL)) || Response.error();
      }
    })());
    return;
  }

  if (url.pathname.includes("/assets/music/ronald-kah/chunks/") && url.pathname.endsWith(".mp3")) {
    event.respondWith((async () => {
      const cache = await caches.open(OFFLINE_MUSIC_CACHE);
      return (await cache.match(request)) || fetch(request);
    })());
    return;
  }

  if (!APP_SHELL_URLS.has(url.href)) return;

  event.respondWith((async () => {
    const cached = await caches.match(request);
    if (cached) return cached;
    return fetch(request);
  })());
});
