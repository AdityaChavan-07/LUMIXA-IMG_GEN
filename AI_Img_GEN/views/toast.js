/**
 * toast.js — beautiful, animated toast notifications.
 * Respects the "notifications" toggle in Settings.
 */
const Toast = (() => {
  const ICONS = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6L9 17l-5-5"/></svg>',
    warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 9v4M12 17h.01M10.3 3.86l-8.2 14.2A1 1 0 003 19.7h18a1 1 0 00.9-1.64l-8.2-14.2a1 1 0 00-1.8 0z"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 8v5M12 16h.01"/></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="9"/><path d="M12 11v5M12 8h.01"/></svg>'
  };

  let stack;

  function init() {
    stack = document.getElementById('toastStack');
  }

  function isEnabled() {
    const settings = Utils.storage.get('LUMIXA.settings', {});
    return settings.notifications !== false;
  }

  function show(message, type = 'info', duration = 4200) {
    if (!stack) init();
    if (!isEnabled() && type !== 'error') return; // errors always surface

    const el = document.createElement('div');
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span class="toast__icon">${ICONS[type] || ICONS.info}</span><span>${Utils.escapeHtml(message)}</span>`;
    stack.appendChild(el);

    const remove = () => {
      el.classList.add('is-leaving');
      setTimeout(() => el.remove(), 280);
    };
    setTimeout(remove, duration);
    el.addEventListener('click', remove);
  }

  return {
    init,
    success: (msg) => show(msg, 'success'),
    warning: (msg) => show(msg, 'warning'),
    error: (msg) => show(msg, 'error', 6000),
    info: (msg) => show(msg, 'info')
  };
})();
