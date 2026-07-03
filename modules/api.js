// ─── API ──────────────────────────────────────────────────────────────────────
// Fetches live data from the expanded server's local HTTP API.
// Returns the full JSON object on success, null on failure.

async function fetchLiveData() {
  try {
    const r = await fetch(`http://localhost:${API_PORT}/`, {
      signal: AbortSignal.timeout(400)
    });
    if (!r.ok) return null;
    const d = await r.json();
    if (d.version) cachedVersion = d.version;
    cachedApiData = d;
    return d;
  } catch {
    // Fallback: try via background service worker (handles CORS restrictions)
    try {
      return await new Promise((resolve) => {
        chrome.runtime.sendMessage({ type: 'fetchTitle', port: API_PORT }, (resp) => {
          if (chrome.runtime.lastError || !resp) return resolve(null);
          if (resp.version) cachedVersion = resp.version;
          cachedApiData = resp;
          resolve(resp);
        });
        setTimeout(() => resolve(null), 800);
      });
    } catch {
      return null;
    }
  }
}

// Convenience wrapper — just returns the title string or null
async function fetchLiveTitle() {
  const d = await fetchLiveData();
  return d ? (d.title || null) : null;
}
