export const CHUNK_LOAD_RECOVERY_INLINE = `(function(){
  var RELOAD_KEY = 'next-chunk-reload';
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

  function clearSwCaches(done) {
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
    if (!tasks.length) {
      done();
      return;
    }
    Promise.all(tasks).then(done).catch(done);
  }

  function recover() {
    if (recovering) return;
    if (sessionStorage.getItem(RELOAD_KEY) === '1') return;
    recovering = true;
    sessionStorage.setItem(RELOAD_KEY, '1');
    clearSwCaches(function() {
      window.location.reload();
    });
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

  window.addEventListener('load', function() {
    sessionStorage.removeItem(RELOAD_KEY);
    var url = new URL(window.location.href);
    if (!url.searchParams.has('_cr')) return;
    url.searchParams.delete('_cr');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  });

  clearSwCaches(function() {});
})();`
