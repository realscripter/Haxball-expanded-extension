// ─── COMMANDS AUTOCOMPLETE ───────────────────────────────────────────────────
// Synchronizes available server commands and shows a tab-completable dropdown.

window.hxAvailableCommands = {
  '/title': 'Change the room title',
  '/popup': 'Show a test action popup'
};

let selectedIndex = 0;
let filteredCommands = [];

function getChatInput() {
  return document.querySelector('input[data-hook="input"]') || 
         document.querySelector('.chatinput input') || 
         document.querySelector('[data-hook="input"]');
}

function getAutocompleteDropdown() {
  return document.getElementById('hx-autocomplete-dropdown');
}

function removeAutocompleteDropdown() {
  const dropdown = getAutocompleteDropdown();
  if (dropdown) dropdown.remove();
}

function getMatches(typed) {
  const keys = Array.isArray(window.hxAvailableCommands)
    ? window.hxAvailableCommands
    : Object.keys(window.hxAvailableCommands || {});
  
  return keys.filter(c => c.toLowerCase().startsWith(typed.toLowerCase()));
}

function isCustomCommand(val) {
  const parts = val.trim().split(/\s+/);
  if (parts.length === 0) return false;
  const cmd = parts[0].toLowerCase();
  const keys = Array.isArray(window.hxAvailableCommands)
    ? window.hxAvailableCommands
    : Object.keys(window.hxAvailableCommands || {});
  return keys.some(k => k.toLowerCase() === cmd);
}

function showAutocompleteDropdown(inputEl, matches) {
  removeAutocompleteDropdown();
  if (matches.length === 0) return;

  filteredCommands = matches;
  if (selectedIndex >= filteredCommands.length) {
    selectedIndex = 0;
  }

  const dropdown = document.createElement('div');
  dropdown.id = 'hx-autocomplete-dropdown';
  
  // High-fidelity premium Haxball-like dark style
  Object.assign(dropdown.style, {
    position: 'absolute',
    bottom: (inputEl.offsetHeight + 8) + 'px',
    left: '0',
    width: '280px',
    background: 'rgba(23, 28, 41, 0.96)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(56, 189, 248, 0.35)',
    borderRadius: '8px',
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.7), 0 0 0 1px rgba(56, 189, 248, 0.15)',
    zIndex: '999999',
    padding: '6px 0',
    fontFamily: '"Outfit", "Inter", "Helvetica Neue", sans-serif',
    fontSize: '13px',
    color: '#e2e8f0',
    animation: 'hxSlideUp 0.15s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  // Inject CSS animation if not already present
  if (!document.getElementById('hx-animation-style')) {
    const animStyle = document.createElement('style');
    animStyle.id = 'hx-animation-style';
    animStyle.textContent = `
      @keyframes hxSlideUp {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
      }
    `;
    document.head.appendChild(animStyle);
  }

  // Header inside the dropdown
  const header = document.createElement('div');
  header.textContent = 'SERVER COMMANDS';
  Object.assign(header.style, {
    padding: '6px 14px 8px 14px',
    fontSize: '9px',
    fontWeight: 'bold',
    letterSpacing: '1px',
    color: '#64748b',
    borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
    marginBottom: '4px'
  });
  dropdown.appendChild(header);

  matches.forEach((cmd, idx) => {
    const isSelected = idx === selectedIndex;
    const desc = (!Array.isArray(window.hxAvailableCommands) && window.hxAvailableCommands)
      ? (window.hxAvailableCommands[cmd] || '')
      : '';

    const item = document.createElement('div');
    Object.assign(item.style, {
      padding: '8px 14px',
      cursor: 'pointer',
      display: 'flex',
      flexDirection: 'column',
      gap: '2px',
      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
      borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent',
      transition: 'background-color 0.1s ease, border-left-color 0.1s ease'
    });

    const cmdLine = document.createElement('div');
    cmdLine.textContent = cmd;
    Object.assign(cmdLine.style, {
      fontWeight: 'bold',
      color: isSelected ? '#38bdf8' : '#f8fafc'
    });
    item.appendChild(cmdLine);

    if (desc) {
      const descLine = document.createElement('div');
      descLine.textContent = desc;
      Object.assign(descLine.style, {
        fontSize: '11px',
        color: isSelected ? '#bae6fd' : '#94a3b8'
      });
      item.appendChild(descLine);
    }

    item.addEventListener('mouseenter', () => {
      selectedIndex = idx;
      updateSelection(dropdown);
    });

    item.addEventListener('click', () => {
      autocompleteValue(inputEl, cmd);
    });

    dropdown.appendChild(item);
  });

  const parent = inputEl.parentElement;
  if (parent) {
    if (parent.style.position !== 'relative') {
      parent.style.position = 'relative';
    }
    parent.appendChild(dropdown);
  }
}

function updateSelection(dropdown) {
  const items = Array.from(dropdown.children).slice(1); // skip header
  items.forEach((item, idx) => {
    const isSelected = idx === selectedIndex;
    Object.assign(item.style, {
      backgroundColor: isSelected ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
      borderLeft: isSelected ? '3px solid #38bdf8' : '3px solid transparent'
    });

    if (item.children[0]) {
      item.children[0].style.color = isSelected ? '#38bdf8' : '#f8fafc';
      item.children[0].style.fontWeight = isSelected ? 'bold' : 'normal';
    }
    if (item.children[1]) {
      item.children[1].style.color = isSelected ? '#bae6fd' : '#94a3b8';
    }
  });
}

function autocompleteValue(inputEl, cmd) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  if (setter) setter.call(inputEl, cmd + ' '); else inputEl.value = cmd + ' ';
  
  inputEl.dispatchEvent(new Event('input', { bubbles: true }));
  inputEl.dispatchEvent(new Event('change', { bubbles: true }));
  removeAutocompleteDropdown();
  inputEl.focus();
}

function handleChatInputEvents() {
  const input = getChatInput();
  if (!input || input.dataset.hxCmdObs) return;
  input.dataset.hxCmdObs = '1';

  input.addEventListener('input', () => {
    const val = input.value;
    if (val.startsWith('/')) {
      const matches = getMatches(val);
      showAutocompleteDropdown(input, matches);
    } else {
      removeAutocompleteDropdown();
    }
  });

  // Capture phase listener to prevent Haxball from throwing "Unrecognized command"
  input.addEventListener('keydown', (e) => {
    const dropdown = getAutocompleteDropdown();

    if (e.key === 'Enter') {
      const val = input.value.trim();
      if (val.startsWith('/')) {
        // If dropdown is open and we haven't autocompleted the command prefix yet, autocomplete it first
        if (dropdown && filteredCommands[selectedIndex]) {
          const matchedCmd = filteredCommands[selectedIndex];
          if (val.toLowerCase() !== matchedCmd.toLowerCase()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            autocompleteValue(input, matchedCmd);
            return;
          }
        }

        // If it is a registered server command, intercept and route it silently
        if (isCustomCommand(val)) {
          e.preventDefault();
          e.stopImmediatePropagation();

          sendChatAsPlayer('_ext_cmd_' + val);

          // Clear input element safely
          const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
          if (setter) setter.call(input, ''); else input.value = '';
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
          removeAutocompleteDropdown();
          return;
        }
      }
    }

    if (!dropdown) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      selectedIndex = (selectedIndex + 1) % filteredCommands.length;
      updateSelection(dropdown);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      selectedIndex = (selectedIndex - 1 + filteredCommands.length) % filteredCommands.length;
      updateSelection(dropdown);
    } else if (e.key === 'Tab') {
      if (filteredCommands[selectedIndex]) {
        e.preventDefault();
        e.stopImmediatePropagation();
        autocompleteValue(input, filteredCommands[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      e.preventDefault();
      removeAutocompleteDropdown();
    }
  }, true); // Crucial: true runs this in the CAPTURE phase BEFORE Haxball processes it!

  // Remove dropdown when clicking outside
  document.addEventListener('click', (e) => {
    const dropdown = getAutocompleteDropdown();
    if (dropdown && !dropdown.contains(e.target) && e.target !== input) {
      removeAutocompleteDropdown();
    }
  });
}

// ─── COMMANDS OBSERVER ────────────────────────────────────────────────────────
new MutationObserver(mutations => {
  handleChatInputEvents();

  for (const m of mutations) {
    for (const node of m.addedNodes) {
      if (node.nodeType !== Node.ELEMENT_NODE) continue;
      const text = node.textContent || '';
      
      // Filter out unverified join/leave/kick/ban messages to prevent chat spam
      if (text.startsWith('* ')) {
        const hasSig = text.includes('\u200B\u200C\u200D');
        if (!hasSig) {
          const isJoinLeaveKick = /\b(join|leave|left|kick|ban|aansl|verlaten|verwijderd|verbannen)\b/i.test(text);
          if (isJoinLeaveKick) {
            node.remove();
            continue;
          }
        }
      }
      
      // Listen for commands list sync
      const cmdMarker = '_ext_commands_';
      const cmdIdx = text.indexOf(cmdMarker);
      if (cmdIdx !== -1) {
        node.remove(); // Hide sync message instantly
        try {
          const rawSync = text.substring(cmdIdx + cmdMarker.length).replace(/[\u200B\u200C\u200D]+/g, '').trim();
          const list = JSON.parse(rawSync);
          window.hxAvailableCommands = list;
        } catch (err) {
          console.error('[Extension] Error parsing commands:', err);
        }
      }
    }
  }
}).observe(document.documentElement, { childList: true, subtree: true });
