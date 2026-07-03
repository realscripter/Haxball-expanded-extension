// ─── NICK / SIGNATURE INJECTION ───────────────────────────────────────────────
// Appends invisible zero-width characters to the player's nickname on join,
// so the server can verify the extension is installed.

function setNativeValue(input, val) {
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  if (setter) setter.call(input, val); else input.value = val;
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
}

function getNickInput() {
  return Array.from(document.querySelectorAll('input[type="text"]'))
    .find(i => i.getAttribute('data-hook') === 'input' || i.maxLength === 25);
}

function cleanInputSignature() {
  if (isSubmitting) return;
  const input = getNickInput();
  if (input && input.value.includes(SIGNATURE)) {
    setNativeValue(input, input.value.replace(SIG_RE, ''));
  }
}

function injectSignature() {
  const input = getNickInput();
  if (!input || !input.value || input.value.endsWith(SIGNATURE)) return;
  isSubmitting = true;
  setNativeValue(input, input.value.replace(SIG_RE, '') + SIGNATURE);
  setTimeout(() => { isSubmitting = false; cleanInputSignature(); }, 600);
}

document.addEventListener('click', e => {
  if (e.target && (e.target.getAttribute('data-hook') === 'ok' || e.target.innerText === 'OK'))
    injectSignature();
}, true);
document.addEventListener('keydown', e => { if (e.key === 'Enter') injectSignature(); }, true);
