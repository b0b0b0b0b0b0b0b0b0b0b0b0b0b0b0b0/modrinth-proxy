export const CHUNK_LOAD_RECOVERY_INLINE = `(function(){
  var RELOAD_KEY = 'next-chunk-reload';
  var MIGRATE_KEY = 'pwa-no-chunk-precache-v1';
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

  function recover(forceTeardown) {
    if (recovering || sessionStorage.getItem(RELOAD_KEY)) return;
    recovering = true;
    sessionStorage.setItem(RELOAD_KEY, '1');

    if (forceTeardown) {
      teardownSwCaches(reloadWithCacheBust);
      return;
    }

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
    recover(String(event.message || '').indexOf('bad-precaching-response') !== -1);
  }, true);

  window.addEventListener('unhandledrejection', function(event) {
    if (!isChunkFailure(event)) return;
    event.preventDefault();
    var message = String((event.reason && event.reason.message) || event.reason || '');
    recover(message.indexOf('bad-precaching-response') !== -1);
  });

  if (!localStorage.getItem(MIGRATE_KEY) && 'serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      if (!regs.length) {
        localStorage.setItem(MIGRATE_KEY, '1');
        return;
      }
      teardownSwCaches(function() {
        localStorage.setItem(MIGRATE_KEY, '1');
        reloadWithCacheBust();
      });
    }).catch(function() {
      localStorage.setItem(MIGRATE_KEY, '1');
    });
  }
})();`
