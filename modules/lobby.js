// ─── LOBBY ROOM LIST ──────────────────────────────────────────────────────────
// Augments the Haxball room list with an "Extended" column and live title updates.

function injectStyles() {
  if (document.getElementById('hx-styles')) return;
  const s = document.createElement('style');
  s.id = 'hx-styles';
  s.textContent = `
    .dialog.hx-lobby { width: 950px !important; }
    .dialog.hx-lobby .list { width: 780px !important; }
    .dialog.hx-lobby table.header,
    .dialog.hx-lobby [data-hook="listscroll"] table { width: 100% !important; }
    body.hx-ext-only [data-hook="list"] tr:not(.hx-ext-yes) { display: none !important; }
    
    /* Ensure checkmark inside our custom filter is styled correctly and doesn't wrap/float */
    #hx-show-btn i.icon-ok {
      position: static !important;
      display: inline-block !important;
      margin-left: 5px !important;
    }
  `;
  document.head.appendChild(s);
}

function createIndicator() {
  if (window !== window.top) return;
  if (document.getElementById('hx-indicator')) return;
  const el = document.createElement('div');
  el.id = 'hx-indicator';
  el.textContent = 'Haxball Extended';
  Object.assign(el.style, {
    position: 'fixed', bottom: '15px', right: '15px',
    background: 'rgba(15,23,42,0.92)', color: '#fff',
    padding: '5px 11px', borderRadius: '6px',
    fontFamily: 'system-ui,sans-serif', fontSize: '12px', fontWeight: '500',
    zIndex: '9999999', pointerEvents: 'none',
    border: '1px solid rgba(255,255,255,0.15)',
    boxShadow: '0 4px 6px rgba(0,0,0,0.2)'
  });
  document.body.appendChild(el);
}

function filterRooms() {
  const btn = document.getElementById('hx-show-btn');
  const active = btn && btn.classList.contains('selected');
  document.body.classList.toggle('hx-ext-only', active);
}

function injectFilterCheckbox() {
  if (document.getElementById('hx-show-btn')) return;
  const emptyFilter = document.querySelector('[data-hook="fil-empty"]');
  if (!emptyFilter) return;

  const parent = emptyFilter.parentElement;

  const btn = document.createElement('span');
  btn.id = 'hx-show-btn';
  btn.className = 'bool';
  btn.textContent = 'Show extended';
  btn.style.cursor = 'pointer';

  const icon = document.createElement('i');
  icon.className = 'icon-ok';
  
  // Restore filter state from localStorage
  const wasActive = localStorage.getItem('hx-show-extended') === 'true';
  let active = wasActive;
  
  if (active) {
    btn.classList.add('selected');
    icon.style.setProperty('display', 'inline-block', 'important');
    document.body.classList.add('hx-ext-only');
  } else {
    icon.style.setProperty('display', 'none', 'important');
  }
  
  btn.appendChild(icon);

  btn.addEventListener('click', () => {
    active = !active;
    btn.classList.toggle('selected', active);
    icon.style.setProperty('display', active ? 'inline-block' : 'none', 'important');
    localStorage.setItem('hx-show-extended', active ? 'true' : 'false');
    filterRooms();
  });

  // Insert right after Show empty
  emptyFilter.parentNode.insertBefore(btn, emptyFilter.nextSibling);
}

function isLocalRoom(row) {
  const distCell = row.querySelector('[data-hook="distance"]');
  if (!distCell) return false;
  const txt = distCell.textContent.trim().replace(/\s+/g, '').toLowerCase();
  return txt === '0km' || txt === '0.0km';
}

function processRow(row) {
  const cells = row.querySelectorAll('td');
  if (cells.length < 4) return;

  const nameSpan = cells[0].querySelector('[data-hook="name"]');
  const nameEl   = nameSpan || cells[0];
  const rawText  = nameEl.textContent;
  const isExt    = rawText.includes(SIGNATURE) || row.dataset.isExpanded === 'true';

  // Clean invisible signature from displayed name and remember it was expanded
  if (rawText.includes(SIGNATURE)) {
    row.dataset.isExpanded = 'true';
    nameEl.textContent = rawText.replace(SIG_RE, '');
  }

  // Show live title for our local expanded room
  if (isExt && isLocalRoom(row) && cachedLiveTitle) {
    nameEl.textContent = cachedLiveTitle;
  }

  // ── Players column (cells[1]) ─────────────────────────────────────────────
  // For our local expanded room, overwrite with real player count from the API
  const playersCell = cells[1];
  if (playersCell && isExt && isLocalRoom(row) && cachedApiData && cachedApiData.players != null) {
    playersCell.textContent = cachedApiData.players + '/' + cachedApiData.maxPlayers;
  }

  // ── Pass column (cells[2]) ────────────────────────────────────────────────
  // Color Yes = green, No = red
  const passCell = cells[2];
  if (passCell && !passCell.dataset.hxPass) {
    passCell.dataset.hxPass   = '1';
    const hasPass             = passCell.textContent.trim().toLowerCase() === 'yes';
    passCell.style.fontWeight = 'bold';
    passCell.style.color      = hasPass ? '#10b981' : '#ef4444';
  }

  // ── Extended badge cell ───────────────────────────────────────────────────
  const badge = row.querySelector('.hx-badge');
  if (badge) {
    row.classList.toggle('hx-ext-yes', isExt);
    badge.textContent  = isExt ? 'Yes' : 'No';
    badge.style.color  = isExt ? '#10b981' : '#ef4444';
    badge.title        = (isExt && isLocalRoom(row) && cachedVersion) ? 'v' + cachedVersion : '';
    badge.style.cursor = badge.title ? 'help' : 'default';
  } else {
    row.classList.toggle('hx-ext-yes', isExt);
    const td = document.createElement('td');
    td.className = 'hx-badge';
    Object.assign(td.style, {
      padding: '8px 0 8px 10px', textAlign: 'left', fontWeight: 'bold',
      color: isExt ? '#10b981' : '#ef4444'
    });
    td.textContent = isExt ? 'Yes' : 'No';
    if (isExt && isLocalRoom(row) && cachedVersion) {
      td.title = 'v' + cachedVersion;
      td.style.cursor = 'help';
    }
    row.appendChild(td);
  }
}

function processRoomList() {
  const dialog     = document.querySelector('.dialog');
  const listScroll = dialog && dialog.querySelector('[data-hook="listscroll"]');

  if (!listScroll) {
    document.querySelectorAll('.dialog.hx-lobby').forEach(d => d.classList.remove('hx-lobby'));
    return;
  }

  dialog.classList.add('hx-lobby');
  injectStyles();

  document.querySelectorAll('table.header colgroup, [data-hook="listscroll"] colgroup').forEach(cg => {
    if (!cg.dataset.hxCols) {
      cg.dataset.hxCols = '1';
      const col = document.createElement('col');
      cg.appendChild(col);
    }
    
    const cols = cg.querySelectorAll('col');
    if (cols.length >= 5) {
      cols[0].style.width = 'auto';      // Name column takes remaining space
      cols[1].style.width = '8ch';       // Players
      cols[2].style.width = '6ch';       // Pass
      cols[3].style.width = '12ch';      // Distance
      cols[4].style.width = '100px';     // Expanded (ample room for "Expanded")
    }
  });

  const headerRow = document.querySelector('table.header tr');
  if (headerRow && !headerRow.dataset.hxHeader) {
    headerRow.dataset.hxHeader = '1';
    const th = document.createElement('th');
    th.textContent = 'Expanded'; // Full label "Expanded"
    Object.assign(th.style, { padding: '8px 0 8px 10px', color: '#fff', textAlign: 'left' });
    headerRow.appendChild(th);
  }

  document.querySelectorAll('[data-hook="list"] tr').forEach(processRow);
  injectFilterCheckbox();
  filterRooms();
}

function applyTitleToLobbyRows() {
  document.querySelectorAll('[data-hook="list"] tr.hx-ext-yes').forEach(row => {
    if (!isLocalRoom(row) || !cachedLiveTitle) return;
    const nameSpan = row.querySelector('[data-hook="name"]');
    const nameEl   = nameSpan || row.querySelector('td');
    if (nameEl && nameEl.textContent !== cachedLiveTitle) {
      nameEl.textContent = cachedLiveTitle;
    }
  });
}

// ─── LOBBY OBSERVER ───────────────────────────────────────────────────────────
let boundListEl    = null;
let lobbyObs       = null;
let titlePollTimer = null;

function startTitlePoll() {
  if (titlePollTimer) return;
  titlePollTimer = setInterval(async () => {
    if (!document.querySelector('[data-hook="listscroll"]')) {
      clearInterval(titlePollTimer);
      titlePollTimer = null;
      return;
    }
    const d = await fetchLiveData();
    const title = d ? d.title : null;
    if (title && title !== cachedLiveTitle) {
      cachedLiveTitle = title;
      applyTitleToLobbyRows();
    }
    // Re-run processRoomList so player counts stay fresh
    processRoomList();
  }, 500);
}

function tryBindLobbyObserver() {
  const list = document.querySelector('[data-hook="list"]');

  if (boundListEl && !boundListEl.isConnected) {
    if (lobbyObs) { lobbyObs.disconnect(); lobbyObs = null; }
    boundListEl = null;
  }

  if (list && list !== boundListEl) {
    if (lobbyObs) lobbyObs.disconnect();
    boundListEl = list;
    lobbyObs = new MutationObserver(() => processRoomList());
    lobbyObs.observe(list, { childList: true });
    processRoomList();

    fetchLiveData().then(d => {
      if (d && d.title) {
        cachedLiveTitle = d.title;
        applyTitleToLobbyRows();
      }
    });

    startTitlePoll();
  }

  if (!list) {
    processRoomList();
  }
}

new MutationObserver(tryBindLobbyObserver)
  .observe(document.body, { childList: true, subtree: true });
