export const CHUNK_LOAD_RECOVERY_INLINE = `(function(){
  var NAV_KEY = 'chunk-hard-nav';
  var pending = false;

  function isChunkFailure(event) {
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

  function retryScript(target) {
    if (!target || target.dataset.chunkRetried === '1') return false;
    var src = target.src || '';
    if (src.indexOf('/_next/static/') === -1) return false;

    target.dataset.chunkRetried = '1';
    var retry = document.createElement('script');
    retry.src = src.split('?')[0] + '?r=' + Date.now();
    retry.async = true;
    if (target.defer) retry.defer = true;
    if (target.crossOrigin) retry.crossOrigin = target.crossOrigin;
    target.parentNode.insertBefore(retry, target.nextSibling);
    return true;
  }

  function hardNavOnce() {
    if (pending) return;
    if (sessionStorage.getItem(NAV_KEY) === '1') return;
    pending = true;
    sessionStorage.setItem(NAV_KEY, '1');
    window.location.href = window.location.pathname + window.location.search + window.location.hash;
  }

  document.addEventListener('click', function(event) {
    var link = event.target && event.target.closest ? event.target.closest('a[href]') : null;
    if (!link) return;
    try {
      if (new URL(link.href).origin === window.location.origin) {
        sessionStorage.removeItem(NAV_KEY);
      }
    } catch (e) {}
  }, true);

  window.addEventListener('error', function(event) {
    var target = event && event.target;
    if (target && target.tagName === 'SCRIPT') {
      var src = target.src || '';
      if (src.indexOf('/_next/static/') !== -1) {
        event.preventDefault();
        if (retryScript(target)) return;
        hardNavOnce();
        return;
      }
    }
    if (!isChunkFailure(event)) return;
    event.preventDefault();
    hardNavOnce();
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    if (!isChunkFailure(event)) return;
    event.preventDefault();
    hardNavOnce();
  });

  window.addEventListener('load', function() {
    var url = new URL(window.location.href);
    if (!url.searchParams.has('_cr')) return;
    url.searchParams.delete('_cr');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  });

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(reg) { reg.unregister(); });
    });
  }
})();`
