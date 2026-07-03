// ─── EXPANDED BUTTON ──────────────────────────────────────────────────────────
// Injects the green "Expanded" button into the room header bar.
// Only called when the server API confirms this is an expanded room.

function injectExpandedBadge() {
  const container = document.querySelector('.header-btns');
  if (!container) return;
  if (document.getElementById('hx-expanded-btn')) return;

  const btn = document.createElement('button');
  btn.id = 'hx-expanded-btn';

  const icon = document.createElement('i');
  icon.className       = 'icon-cog';
  icon.style.marginRight = '6px';
  btn.appendChild(icon);
  btn.appendChild(document.createTextNode('Expanded'));

  Object.assign(btn.style, {
    background:    '#1e6b3a',
    color:         '#fff',
    border:        'none',
    borderRadius:  '4px',
    padding:       '4px 10px',
    marginLeft:    '5px',
    fontWeight:    'bold',
    cursor:        'pointer',
    fontSize:      '13px',
    fontFamily:    'inherit',
    lineHeight:    'normal',
    verticalAlign: 'baseline',
    transition:    'background 0.15s ease'
  });

  btn.addEventListener('mouseenter', () => { btn.style.background = '#278a4c'; });
  btn.addEventListener('mouseleave', () => { btn.style.background = '#1e6b3a'; });
  btn.addEventListener('click',      () => openStatsDialog());

  container.appendChild(btn);

  // Re-inject if React destroys the button (e.g. when clicking Rec or Link)
  if (!container.dataset.hxListener) {
    container.dataset.hxListener = '1';
    container.addEventListener('click', () => setTimeout(injectExpandedBadge, 0));
  }
}
