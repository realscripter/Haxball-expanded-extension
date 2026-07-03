// ─── BOOT ─────────────────────────────────────────────────────────────────────
// All logic lives in modules/. This file only wires up the polling loops.

createIndicator();
injectStyles();
setInterval(createIndicator, 3000);

// Signature cleanup + title cleaning every 300ms
setInterval(() => {
  cleanTitleDOM();
  cleanInputSignature();
}, 300);

// Helper to extract Haxball room code
function getRoomCode(url) {
  if (!url) return null;
  const match = url.match(/[?&]c=([^&#]+)/);
  return match ? match[1] : null;
}

// Room polling — 150ms: show/hide button and update tab title
setInterval(async () => {
  const inRoom = document.querySelector('.header-btns');

  if (!inRoom) {
    // Left the room — restore title and remove button
    if (isExpandedRoom) {
      document.title = 'Haxball';
      isExpandedRoom = false;
    }
    const existing = document.getElementById('hx-expanded-btn');
    if (existing) existing.remove();
    return;
  }

  // In a room: check if the server API confirms this is expanded
  const d = await fetchLiveData();
  const currentCode = getRoomCode(window.location.href);
  const serverCode = d ? getRoomCode(d.roomLink) : null;

  if (d && d.title && currentCode && currentCode === serverCode) {
    isExpandedRoom   = true;
    document.title   = d.title;
    cachedLiveTitle  = d.title;
    injectExpandedBadge();
    
    // Update player list header count inside the room
    if (d.players != null && d.maxPlayers != null) {
      const pTitle = document.querySelector('[data-hook="players-title"]');
      if (pTitle) {
        pTitle.textContent = `Players (${d.players} / ${d.maxPlayers})`;
      }
    }
  } else {
    isExpandedRoom = false;
    const existing = document.getElementById('hx-expanded-btn');
    if (existing) existing.remove();
  }
}, 150);
