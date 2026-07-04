/**
 * sidebar.js — collapsible sidebar, mobile nav drawer, and view routing.
 * Views are swapped client-side (no backend routes exist for them);
 * other modules listen for "LUMIXA:view-changed" to lazily render.
 */
const Sidebar = (() => {
  const STORAGE_QUOTA_BYTES = 250 * 1024 * 1024; // fictitious local quota for the UI meter
  let appEl, sidebarEl, navItems, viewTitle, scrim;

  const VIEW_LABELS = {
    generate: 'Generate', history: 'History', favorites: 'Favorites',
    gallery: 'Gallery', models: 'Models', settings: 'Settings', help: 'Help'
  };

  function init() {
    appEl = document.getElementById('app');
    sidebarEl = document.getElementById('sidebar');
    navItems = Array.from(document.querySelectorAll('.nav__item'));
    viewTitle = document.getElementById('viewTitle');
    scrim = document.getElementById('scrim');

    document.getElementById('sidebarCollapseBtn').addEventListener('click', toggleCollapse);
    document.getElementById('mobileMenuBtn').addEventListener('click', openMobile);
    scrim.addEventListener('click', closeMobile);

    navItems.forEach((btn) => {
      btn.addEventListener('click', () => {
        setView(btn.dataset.view);
        closeMobile();
      });
    });

    const collapsed = Utils.storage.get('LUMIXA.sidebarCollapsed', false);
    if (collapsed) appEl.classList.add('is-collapsed');

    updateStorageMeter();
  }

  function toggleCollapse() {
    const isCollapsed = appEl.classList.toggle('is-collapsed');
    document.getElementById('sidebarCollapseBtn').setAttribute('aria-expanded', String(!isCollapsed));
    Utils.storage.set('LUMIXA.sidebarCollapsed', isCollapsed);
  }

  function openMobile() { appEl.classList.add('is-mobile-open'); scrim.classList.remove('hidden'); }
  function closeMobile() { appEl.classList.remove('is-mobile-open'); scrim.classList.add('hidden'); }

  function setView(viewName) {
    navItems.forEach((b) => b.classList.toggle('is-active', b.dataset.view === viewName));
    document.querySelectorAll('.view').forEach((v) => v.classList.toggle('is-active', v.id === `view-${viewName}`));
    viewTitle.textContent = VIEW_LABELS[viewName] || 'LUMIXA';
    document.dispatchEvent(new CustomEvent('LUMIXA:view-changed', { detail: viewName }));
  }

  function updateStorageMeter() {
    const history = Utils.storage.get('LUMIXA.history', []);
    const totalBytes = history.reduce((sum, rec) => sum + Utils.base64Size(rec.image), 0);
    const pct = Math.min(100, (totalBytes / STORAGE_QUOTA_BYTES) * 100);
    const fill = document.getElementById('storageFill');
    const text = document.getElementById('storageText');
    if (fill) fill.style.width = `${pct}%`;
    if (text) text.textContent = `${Utils.formatBytes(totalBytes)} / 250 MB`;
  }

  return { init, setView, updateStorageMeter };
})();
