// ─── TITLE MANAGEMENT ─────────────────────────────────────────────────────────
// Finds the room name element in the DOM and keeps it in sync with the
// live title from the server API.

function findRoomNameElement() {
  const headerBtns = document.querySelector('.header-btns');
  if (headerBtns && headerBtns.parentElement) {
    for (const child of headerBtns.parentElement.children) {
      if (child !== headerBtns && !child.contains(headerBtns)) {
        return child;
      }
    }
  }
  return null;
}

function cleanTitleDOM() {
  // Only run when inside a room
  if (!document.querySelector('.header-btns')) return;

  const el = findRoomNameElement();
  if (!el) return;

  const text = el.textContent || '';
  if (text.includes(SIGNATURE)) {
    el.textContent = text.replace(SIG_RE, '');
  }
}

function applyTitle(newTitle) {
  document.title = newTitle;

  const el = findRoomNameElement();
  if (el) {
    el.textContent = newTitle;
  }
}

// ─── CHAT OBSERVER ────────────────────────────────────────────────────────────
// Listens for _ext_title_change_ chat messages from the host bot and applies
// the new title. Messages from other players are ignored (security).
new MutationObserver(mutations => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const text  = node.textContent || '';
      const marker = '_ext_title_change_';
      const idx   = text.indexOf(marker);
      if (idx === -1) continue;

      const senderPrefix  = text.substring(0, idx).trim();
      const isValidSender = senderPrefix === '' ||
                            senderPrefix.startsWith('Host Bot') ||
                            (senderPrefix.endsWith(':') && senderPrefix.includes('Host Bot'));

      if (isValidSender) {
        const newTitle = text.substring(idx + marker.length).trim();
        node.remove();
        applyTitle(newTitle);
      }
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });
