export const CHUNK_LOAD_RECOVERY_INLINE = `(function(){
  var RELOAD_KEY = 'next-chunk-reload';
  var SW_CLEANUP_KEY = 'next-sw-cleanup-v1';
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
      || message.indexOf('ERR_HTTP2_PROTOCOL_ERROR') !== -1
      || message.indexOf('Failed to fetch dynamically imported module') !== -1
      || message.indexOf('Importing a module script failed') !== -1;
  }

  function reloadWithCacheBust() {
    var url = new URL(window.location.href);
    url.searchParams.set('_cr', String(Date.now()));
    window.location.replace(url.toString());
  }

  function recover() {
    if (recovering || sessionStorage.getItem(RELOAD_KEY)) return;
    recovering = true;
    sessionStorage.setItem(RELOAD_KEY, '1');

    function finish() {
      reloadWithCacheBust();
    }

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
      finish();
      return;
    }

    Promise.all(tasks).then(finish).catch(finish);
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

  if (!sessionStorage.getItem(SW_CLEANUP_KEY) && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      if (!regs.length) {
        sessionStorage.setItem(SW_CLEANUP_KEY, '1');
        return;
      }
      return Promise.all(regs.map(function(reg) { return reg.unregister(); }))
        .then(function() {
          if ('caches' in window) {
            return caches.keys().then(function(keys) {
              return Promise.all(keys.map(function(key) { return caches.delete(key); }));
            });
          }
        })
        .then(function() {
          sessionStorage.setItem(SW_CLEANUP_KEY, '1');
          window.location.reload();
        });
    }).catch(function() {
      sessionStorage.setItem(SW_CLEANUP_KEY, '1');
    });
  }
})();`
