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
      || message.indexOf('bad-precaching-response') !== -1
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

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration().then(function(reg) {
        if (reg) return reg.update();
      }).finally(reloadWithCacheBust);
      return;
    }

    reloadWithCacheBust();
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
})();`
