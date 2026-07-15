(() => {
  const params = new URLSearchParams(window.location.search);
  if (params.get('staff') !== '1') return;

  const cfg = window.AT_THE_GATE_CONFIG || {};
  const base = String(cfg.googleAppsScriptUrl || '').trim();
  if (!base) return;

  try {
    const url = new URL(base, window.location.href);
    const callback = `fastpass_warmup_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement('script');

    const cleanup = () => {
      delete window[callback];
      script.remove();
    };

    window[callback] = () => cleanup();
    script.onerror = cleanup;
    url.searchParams.set('action', 'warmup');
    url.searchParams.set('callback', callback);
    script.src = url.toString();
    document.body.appendChild(script);

    window.setTimeout(cleanup, 12000);
  } catch (_error) {
    // Warm-up is optional and must never block the scanner.
  }
})();
