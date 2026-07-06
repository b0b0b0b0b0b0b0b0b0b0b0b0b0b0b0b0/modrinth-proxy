export const CHUNK_LOAD_RECOVERY_INLINE = `(function(){
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.getRegistrations().then(function(regs) {
      regs.forEach(function(reg) { reg.unregister(); });
    });
  }

  window.addEventListener('load', function() {
    var url = new URL(window.location.href);
    if (!url.searchParams.has('_cr')) return;
    url.searchParams.delete('_cr');
    history.replaceState(null, '', url.pathname + url.search + url.hash);
  });
})();`
