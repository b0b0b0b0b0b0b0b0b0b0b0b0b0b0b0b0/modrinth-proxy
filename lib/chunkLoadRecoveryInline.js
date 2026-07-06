export const PWA_SW_PATH = '/sw-v2.js'

export const CHUNK_LOAD_RECOVERY_INLINE = `(function(){
  var SW_PATH = '${PWA_SW_PATH}';
  var RELOAD_KEY = 'next-chunk-reload';
  var MIGRATE_KEY = 'pwa-no-chunk-precache-v4';
  var recovering = false;

  function isChunkFailure(event) {
    var target = event && event.target;
    if (target && target.tagName === 'SCRIPT') {
      var src = target.src || '';
      if (src.indexOf('/_next/static/') !== -1) return true;
    }

    var reason = event && event.reason;
    var name = reason && reason.name ? reason.name : '';
    var message = '';
    if (reason && reason.message) message = reason.message;
    else if (event && event.message) message = event.message;
    else if (event && event.error && event.error.message) message = event.error.message;
    else if (reason) message = String(reason);

    return name === 'ChunkLoadError'
      || message.indexOf('ChunkLoadError') !== -1
      || message.indexOf('Loading chunk') !== -1
      || message.indexOf('bad-precaching-response') !== -1
      || message.indexOf('ERR_HTTP2_PROTOCOL_ERROR') !== -1
      || message.indexOf('network error') !== -1
      || message.indexOf('Failed to fetch dynamically imported module') !== -1
      || message.indexOf('Importing a module script failed') !== -1;
  }

  function reloadWithCacheBust() {
    var url = new URL(window.location.href);
    url.searchParams.set('_cr', String(Date.now()));
    window.location.replace(url.toString());
  }

  function registerPwa() {
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register(SW_PATH).catch(function() {});
  }

  function teardownSwCaches(done) {
    var tasks = [];
    if ('caches' in window) {
      tasks.push(caches.keys().then(function(keys) {
        return Promise.all(keys.map(function(key) { return caches.delete(key); }));
      }));
    }
    if ('serviceWorker' in navigator) {
      tasks.push(navigator.serviceWorker.getRegistrations().then(function(regs) {
        return Promise.all(regs.map(function(reg) { return reg.unregister(); }));
      }));
    }
    if (tasks.length === 0) {
      done();
      return;
    }
    Promise.all(tasks).then(done).catch(done);
  }

  function recover() {
    if (recovering) return;
    recovering = true;
    sessionStorage.setItem(RELOAD_KEY, '1');
    teardownSwCaches(reloadWithCacheBust);
  }

  window.addEventListener('error', function(event) {
    if (!isChunkFailure(event)) return;
    event.preventDefault();
    recover();
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    if (!isChunkFailure(event)) return;
    event.preventDefault();
    recover();
  });

  if (!('serviceWorker' in navigator)) return;

  if (localStorage.getItem(MIGRATE_KEY) === '1') {
    registerPwa();
    return;
  }

  teardownSwCaches(function() {
    localStorage.setItem(MIGRATE_KEY, '1');
    reloadWithCacheBust();
  });
})();`
