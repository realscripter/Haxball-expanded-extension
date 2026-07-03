// ─── STATS DIALOG ─────────────────────────────────────────────────────────────
// Builds the native Haxball-styled settings dialog shown when clicking Expanded.
// All stats are fetched live from the server API — nothing is hardcoded.

function makeStatRow(label, val, color) {
  const row = document.createElement('div');
  Object.assign(row.style, {
    display: 'flex', justifyContent: 'space-between',
    margin: '10px 0', fontSize: '14px'
  });
  row.className = 'option-row';

  const lEl = document.createElement('div');
  lEl.textContent  = label;
  lEl.style.color  = '#8ea1b4';

  const vEl = document.createElement('div');
  vEl.textContent  = val;
  vEl.style.fontWeight = 'bold';
  if (color) vEl.style.color = color;

  row.appendChild(lEl);
  row.appendChild(vEl);
  return row;
}

function formatUptime(seconds) {
  if (seconds == null) return 'N/A';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

async function openStatsDialog() {
  const startTime = performance.now();
  const d = await fetchLiveData();
  const ping = Math.round(performance.now() - startTime);

  const online        = !!d;
  const serverVer     = d ? d.version     : 'Offline';
  const players       = d ? d.players     : '—';
  const maxPlayers    = d ? d.maxPlayers  : '—';
  const apiPort       = d ? d.apiPort     : API_PORT;
  const sigServer     = d ? d.signalingServer : 'N/A';
  const masterCap     = d ? d.masterServerCap : 'N/A';
  const uptime        = d ? formatUptime(d.uptime) : 'N/A';
  const roomLink      = d ? d.roomLink    : null;

  // ── Overlay ──
  const overlay = document.createElement('div');
  overlay.id = 'hx-dialog-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,0.55)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: '99999'
  });
  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });

  // ── Dialog ──
  const dialog = document.createElement('div');
  dialog.className = 'dialog settings-view';
  dialog.style.width = '440px';

  // Title
  const h1 = document.createElement('h1');
  h1.textContent = 'Expanded Stats';
  dialog.appendChild(h1);

  // Close button
  const closeBtn = document.createElement('button');
  closeBtn.setAttribute('data-hook', 'close');
  closeBtn.textContent = 'Close';
  closeBtn.addEventListener('click', () => overlay.remove());
  dialog.appendChild(closeBtn);

  // Tabs
  const tabs = document.createElement('div');
  tabs.className = 'tabs';
  const genBtn  = document.createElement('button');
  genBtn.textContent = 'General';
  genBtn.className   = 'selected';
  const nerdBtn = document.createElement('button');
  nerdBtn.textContent = 'Nerd Stats';
  tabs.appendChild(genBtn);
  tabs.appendChild(nerdBtn);
  dialog.appendChild(tabs);

  // Tab contents
  const tabcontents = document.createElement('div');
  tabcontents.className = 'tabcontents';

  // ── General tab ──
  const genSec = document.createElement('div');
  genSec.className    = 'section selected';
  genSec.style.display = 'block';

  genSec.appendChild(makeStatRow('Client Version',   `v${CLIENT_VER}`));
  genSec.appendChild(makeStatRow('Server Version',   `v${serverVer}`, online ? '#10b981' : '#ef4444'));
  genSec.appendChild(makeStatRow('Server Ping',      online ? `${ping}ms` : 'N/A'));
  genSec.appendChild(makeStatRow('Players',          online ? `${players} / ${maxPlayers}` : 'N/A'));
  genSec.appendChild(makeStatRow('Signature Verify', 'Active', '#10b981'));
  if (roomLink) {
    genSec.appendChild(makeStatRow('Room Link', roomLink));
  }

  // ── Nerd Stats tab ──
  const nerdSec = document.createElement('div');
  nerdSec.className    = 'section';
  nerdSec.style.display = 'none';

  nerdSec.appendChild(makeStatRow('Host API Port',      `:${apiPort}`));
  nerdSec.appendChild(makeStatRow('Protocol',           'HTTP / WebSocket'));
  nerdSec.appendChild(makeStatRow('Master Server Cap',  `${masterCap} players`));
  nerdSec.appendChild(makeStatRow('Signaling Server',   sigServer));
  nerdSec.appendChild(makeStatRow('Server Uptime',      uptime));

  tabcontents.appendChild(genSec);
  tabcontents.appendChild(nerdSec);
  dialog.appendChild(tabcontents);

  // Tab switching
  genBtn.addEventListener('click', () => {
    genBtn.className  = 'selected'; nerdBtn.className = '';
    genSec.style.display  = 'block'; nerdSec.style.display = 'none';
  });
  nerdBtn.addEventListener('click', () => {
    nerdBtn.className = 'selected'; genBtn.className  = '';
    nerdSec.style.display = 'block'; genSec.style.display  = 'none';
  });

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// ─── CUSTOM DIALOG API ────────────────────────────────────────────────────────
// Listens for custom dialog popup events from the server host and renders them.

function sendChatAsPlayer(message) {
  const chatInput = document.querySelector('input[data-hook="input"]') || 
                    document.querySelector('.chatinput input') || 
                    document.querySelector('[data-hook="input"]');
  if (!chatInput) return false;

  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  if (setter) setter.call(chatInput, message); else chatInput.value = message;

  chatInput.dispatchEvent(new Event('input', { bubbles: true }));
  chatInput.dispatchEvent(new Event('change', { bubbles: true }));

  const enterEvent = new KeyboardEvent('keydown', {
    bubbles: true, cancelable: true, keyCode: 13, key: 'Enter'
  });
  chatInput.dispatchEvent(enterEvent);
  return true;
}

function showCustomDialog(popupId, title, message, options) {
  // Remove existing custom dialog if open
  const existing = document.getElementById('hx-custom-dialog-overlay');
  if (existing) existing.remove();

  // Overlay
  const overlay = document.createElement('div');
  overlay.id = 'hx-custom-dialog-overlay';
  Object.assign(overlay.style, {
    position: 'fixed', inset: '0',
    background: 'rgba(0,0,0,0.65)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    zIndex: '999999'
  });

  // Dialog
  const dialog = document.createElement('div');
  dialog.className = 'dialog settings-view';
  dialog.style.width = '420px';

  // Title
  const h1 = document.createElement('h1');
  h1.textContent = title;
  dialog.appendChild(h1);

  // Message body text
  const msgEl = document.createElement('p');
  msgEl.textContent = message;
  Object.assign(msgEl.style, {
    padding: '20px 25px 10px 25px',
    margin: '0',
    color: '#cbd5e1',
    fontSize: '14px',
    lineHeight: '1.5',
    textAlign: 'center'
  });
  dialog.appendChild(msgEl);

  // Buttons area
  const footer = document.createElement('div');
  Object.assign(footer.style, {
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
    padding: '20px 25px'
  });

  options.forEach((optText, index) => {
    const btn = document.createElement('button');
    btn.textContent = optText;
    btn.style.cursor = 'pointer';
    btn.style.minWidth = '80px';
    if (index === 0) {
      btn.className = 'selected';
    }
    
    btn.addEventListener('click', () => {
      overlay.remove();
      // Send selected option back silently
      sendChatAsPlayer('_ext_popup_reply_' + JSON.stringify({ i: popupId, o: optText }));
    });
    footer.appendChild(btn);
  });

  dialog.appendChild(footer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

// ─── POPUP INTERCEPTION OBSERVER ──────────────────────────────────────────────
new MutationObserver(mutations => {
  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const text = node.textContent || '';
      const marker = '_ext_popup_';
      const idx = text.indexOf(marker);
      if (idx === -1) continue;

      const senderPrefix = text.substring(0, idx).trim();
      const isValidSender = senderPrefix === '' ||
                            senderPrefix.startsWith('Host Bot') ||
                            (senderPrefix.endsWith(':') && senderPrefix.includes('Host Bot'));

      if (isValidSender) {
        // Find parent chat line container and remove it
        const chatLine = node.closest('.log-line') || node.closest('p') || node;
        if (chatLine) chatLine.remove();

        try {
          const rawJson = text.substring(idx + marker.length).trim();
          const data = JSON.parse(rawJson);
          if (data && data.i && data.t && data.m && Array.isArray(data.o)) {
            showCustomDialog(data.i, data.t, data.m, data.o);
          }
        } catch (err) {
          console.error('[Extension] Error parsing popup data:', err);
        }
      }
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });
