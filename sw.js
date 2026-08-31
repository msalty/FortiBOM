// ── ORIGIN-SAFE CACHE NAMESPACE ──────────────────────────────────────────────
// Every storage API a service worker can reach (CacheStorage, localStorage,
// IndexedDB) is keyed by ORIGIN, not by the worker's scope. On a shared origin
// (e.g. a GitHub Pages user site hosting several apps in subdirectories) the
// naive calls — caches.keys() + delete, caches.match() on the global — reach
// straight into the neighbouring apps' storage. Everything below is namespaced
// by the directory this copy is actually installed in, derived at RUNTIME so
// the app stays portable to any location on any web server.
//
// SCOPE_DIR is the directory containing this script, which is also this
// worker's registration scope: '/FabricBOM/' when deployed to a subdirectory,
// '/' at a domain root, '/a/b/app/' from a nested path. Never hardcoded.
const SCOPE_DIR = new URL('./', self.location).pathname;

const VERSION = 'v1.0.3.3.8';

// The directory is percent-encoded so it cannot contain the '|' delimiter.
// That keeps namespaces of nested installs disjoint as string prefixes: a root
// install is 'fabricbom|%2F|…' and a subdirectory install is
// 'fabricbom|%2Fapp%2F|…', so neither startsWith() the other's namespace.
const CACHE_NS = 'fabricbom|' + encodeURIComponent(SCOPE_DIR) + '|';
const CACHE = CACHE_NS + VERSION;

// Caches written by earlier releases of THIS app, before names were namespaced
// ('fabricbom-v1.0.3.3.5' and friends). They no longer match CACHE_NS, so they
// would leak forever unless swept explicitly. Deliberately anchored and
// version-shaped so it can only ever match this app's own historical scheme.
const LEGACY_CACHE_RE = /^fabricbom-v\d/;

const SHELL = [
  './',
  './index.html',
  './manifest.json',
  './favicon.ico',
  './icons/pwa-192x192.png',
  './icons/pwa-512x512.png',
  './icons/maskable-192x192.png',
  './icons/maskable-512x512.png',
  './icons/apple-touch-icon.png',
  './js/xlsx.mini.min.js',
  './forti-icons/FortiADC-white.svg',
  './forti-icons/FortiAIOps-white.svg',
  './forti-icons/FortiAP-white.svg',
  './forti-icons/FortiAnalyzer-white.svg',
  './forti-icons/FortiAppSec-white.svg',
  './forti-icons/FortiAuthenticator-white.svg',
  './forti-icons/FortiCNAPP-white.svg',
  './forti-icons/FortiClient-white.svg',
  './forti-icons/FortiDDoS-white.svg',
  './forti-icons/FortiDLP-white.svg',
  './forti-icons/FortiDeceptor-white.svg',
  './forti-icons/FortiEDR-white.svg',
  './forti-icons/FortiExtender-white.svg',
  './forti-icons/FortiFlex-white.svg',
  './forti-icons/FortiGate-white.svg',
  './forti-icons/FortiMail-Cloud-white.svg',
  './forti-icons/FortiMail-white.svg',
  './forti-icons/FortiManager-white.svg',
  './forti-icons/FortiMonitor-white.svg',
  './forti-icons/FortiNAC-white.svg',
  './forti-icons/FortiPAM-white.svg',
  './forti-icons/FortiPresence-white.svg',
  './forti-icons/FortiProxy-white.svg',
  './forti-icons/FortiRecon-white.svg',
  './forti-icons/FortiSASE-white.svg',
  './forti-icons/FortiSIEM-white.svg',
  './forti-icons/FortiSOAR-white.svg',
  './forti-icons/FortiSandbox-white.svg',
  './forti-icons/FortiSwitch-white.svg',
  './forti-icons/FortiWeb-white.svg',
  './products/asku.html',
  './products/pricing-quotes.html',
  './products/custom-sku-bomgen.html',
  './products/custom-sku-bomgen-mobile.html',
  './products/fortiadc-bomgen.html',
  './products/fortiaiops-bomgen.html',
  './products/fortianalyzer-bomgen.html',
  './products/fortiap-bomgen.html',
  './products/fortiappsec-bomgen.html',
  './products/fortiauthenticator-bomgen.html',
  './products/forticlient-bomgen.html',
  './products/forticnapp-bomgen.html',
  './products/fortiddos-bomgen.html',
  './products/fortideceptor-bomgen.html',
  './products/fortidlp-bomgen.html',
  './products/fortiedr-bomgen.html',
  './products/fortiextender-bomgen.html',
  './products/fortiflex-bomgen.html',
  './products/fortigate-bomgen.html',
  './products/fortimail-bomgen.html',
  './products/fortimail-workspace-bomgen.html',
  './products/fortimanager-bomgen.html',
  './products/fortimonitor-bomgen.html',
  './products/fortinac-bomgen.html',
  './products/fortipam-bomgen.html',
  './products/fortipresence-bomgen.html',
  './products/fortiproxy-bomgen.html',
  './products/fortirecon-bomgen.html',
  './products/fortisandbox-bomgen.html',
  './products/fortisase-bomgen.html',
  './products/fortisiem-bomgen.html',
  './products/fortisoar-bomgen.html',
  './products/fortiswitch-bomgen.html',
  './products/fortiweb-bomgen.html',
  './products/placeholder-bomgen.html',
  './plugins/plugin-theme.css',
  './plugins/tracker.html',
  './docs/help-faq.html',
  './docs/screenshots/fabricbom-screenshot-demobom.jpg',
  './docs/screenshots/fabricbom-docs-adding_sku.gif',
  './docs/screenshots/fabricbom-docs-saving_pricing.gif',
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      // Only sweep caches this install owns: a stale version under our own
      // namespace, or a pre-namespace cache this app itself wrote. Anything
      // else on the origin belongs to a neighbouring app — leave it alone.
      Promise.all(
        keys
          .filter(k => (k.startsWith(CACHE_NS) && k !== CACHE) || LEGACY_CACHE_RE.test(k))
          .map(k => caches.delete(k))
      )
    ).then(() => self.clients.claim())
  );
});

// Requests this worker is allowed to answer for and take a copy of: same-origin
// and inside our own directory. A subdirectory install must never serve, or
// cache, a file belonging to a neighbouring app on the same origin. SCOPE_DIR
// always ends in '/', so '/app/' does not match '/app2/foo'. At a domain root
// SCOPE_DIR is '/', which correctly matches the whole origin.
function isOwnAsset(url) {
  return url.origin === self.location.origin && url.pathname.startsWith(SCOPE_DIR);
}

self.addEventListener('fetch', event => {
  const request = event.request;
  if (request.method !== 'GET') return;
  if (!isOwnAsset(new URL(request.url))) return; // fall through to the network

  event.respondWith(
    // Match against OUR cache by name. caches.match() on the global consults
    // every cache on the ORIGIN and answers from the first one holding the URL,
    // which may well be another app's copy.
    caches.open(CACHE).then(cache =>
      cache.match(request).then(cached => {
        if (cached) return cached;
        return fetch(request).then(response => {
          if (response && response.status === 200 && response.type === 'basic') {
            cache.put(request, response.clone());
          }
          return response;
        }).catch(() => {
          // Offline shell fallback, for navigations only — returning the app
          // shell in place of a failed image or script just hides the error.
          if (request.mode !== 'navigate') throw new Error('offline');
          return cache.match(new URL('./index.html', self.location).href);
        });
      })
    )
  );
});
