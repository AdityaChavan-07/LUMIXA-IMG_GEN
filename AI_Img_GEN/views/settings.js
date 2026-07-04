/**
 * settings.js — appearance + default generation preferences.
 * Everything here is local-only (localStorage); the backend has no
 * concept of user settings.
 */
const Settings = (() => {
  const DEFAULTS = {
    theme: 'dark',
    accent: '#7C5CFF',
    animations: true,
    language: 'en',
    defaultModel: 'flux',
    defaultQuality: 'standard',
    defaultAspect: '1:1',
    autosave: true,
    notifications: true
  };

  let state = {};

  function init() {
    state = Object.assign({}, DEFAULTS, Utils.storage.get('LUMIXA.settings', {}));
    applyToDom();
    bindInputs();
  }

  function save() {
    Utils.storage.set('LUMIXA.settings', state);
    applyToDom();
  }

  function applyToDom() {
    document.documentElement.style.setProperty('--color-primary', state.accent);
    document.body.dataset.theme = state.theme === 'oled' ? 'oled' : '';
    document.body.classList.toggle('no-animations', !state.animations);

    const map = {
      themeSelect: state.theme, languageSelect: state.language,
      defaultModel: state.defaultModel, defaultQuality: state.defaultQuality,
      defaultAspect: state.defaultAspect
    };
    Object.entries(map).forEach(([id, val]) => { const el = document.getElementById(id); if (el) el.value = val; });

    const toggles = { animationsToggle: 'animations', autosaveToggle: 'autosave', notificationsToggle: 'notifications' };
    Object.entries(toggles).forEach(([id, key]) => { const el = document.getElementById(id); if (el) el.checked = !!state[key]; });

    document.querySelectorAll('.swatch').forEach((sw) => {
      sw.classList.toggle('is-active', sw.dataset.accent.toLowerCase() === state.accent.toLowerCase());
    });
  }

  function bindInputs() {
    document.getElementById('themeSelect').addEventListener('change', (e) => { state.theme = e.target.value; save(); });
    document.getElementById('languageSelect').addEventListener('change', (e) => { state.language = e.target.value; save(); Toast.info('Language preference saved (UI copy stays in English for this demo).'); });
    document.getElementById('defaultModel').addEventListener('change', (e) => { state.defaultModel = e.target.value; save(); });
    document.getElementById('defaultQuality').addEventListener('change', (e) => { state.defaultQuality = e.target.value; save(); });
    document.getElementById('defaultAspect').addEventListener('change', (e) => { state.defaultAspect = e.target.value; save(); });
    document.getElementById('animationsToggle').addEventListener('change', (e) => { state.animations = e.target.checked; save(); });
    document.getElementById('autosaveToggle').addEventListener('change', (e) => { state.autosave = e.target.checked; save(); });
    document.getElementById('notificationsToggle').addEventListener('change', (e) => { state.notifications = e.target.checked; save(); });

    document.querySelectorAll('.swatch').forEach((sw) => {
      sw.addEventListener('click', () => { state.accent = sw.dataset.accent; save(); });
    });

    document.getElementById('clearDataBtn').addEventListener('click', () => {
      if (!confirm('Clear all local history, favorites, gallery images and preferences? This cannot be undone.')) return;
      Utils.storage.remove('LUMIXA.history');
      Utils.storage.remove('LUMIXA.settings');
      Toast.success('Local data cleared');
      setTimeout(() => location.reload(), 600);
    });
  }

  function get() { return state; }

  return { init, get };
})();
