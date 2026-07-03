// Background service worker — proxies title fetch requests from content script to localhost API
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'fetchTitle' && msg.port) {
    fetch(`http://localhost:${msg.port}/`, { signal: AbortSignal.timeout(1500) })
      .then(r => r.json())
      .then(data => sendResponse({ title: data.title || null }))
      .catch(() => sendResponse({ title: null }));
    return true; // Keep the message channel open for async response
  }
});
