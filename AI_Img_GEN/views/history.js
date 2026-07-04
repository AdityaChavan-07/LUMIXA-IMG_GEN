/**
 * history.js — the single source of truth for generated images.
 * Every generation is appended here; Gallery/Favorites/Session grids
 * all read from this store. Persisted to localStorage as base64 PNGs.
 *
 * NOTE: the Flask backend (app.py) has no persistence endpoints —
 * it only returns image bytes for a single /generate call. All
 * history/favorites/gallery bookkeeping happens client-side by design.
 */
const History = (() => {
  const KEY = 'LUMIXA.history';
  let records = [];

  function init() {
    records = Utils.storage.get(KEY, []);
    bindToolbar();
    render();
  }

  function persist() {
    const ok = Utils.storage.set(KEY, records);
    if (!ok) Toast.warning('Local storage is full — older images may not be saved.');
    Sidebar.updateStorageMeter();
  }

  function add(record) {
    records.unshift(record);
    persist();
    render();
    document.dispatchEvent(new CustomEvent('LUMIXA:history-changed'));
  }

  function getAll() { return records; }
  function getById(id) { return records.find((r) => r.id === id); }

  function remove(id) {
    records = records.filter((r) => r.id !== id);
    persist();
    render();
    document.dispatchEvent(new CustomEvent('LUMIXA:history-changed'));
  }

  function toggleFavorite(id) {
    const rec = getById(id);
    if (!rec) return;
    rec.favorite = !rec.favorite;
    persist();
    render();
    document.dispatchEvent(new CustomEvent('LUMIXA:history-changed'));
  }

  function bindToolbar() {
    const search = document.getElementById('historySearch');
    const sort = document.getElementById('historySort');
    const filter = document.getElementById('historyFilter');
    search.addEventListener('input', Utils.debounce(render, 200));
    sort.addEventListener('change', render);
    filter.addEventListener('change', render);
  }

  function render() {
    const container = document.getElementById('historyGroups');
    const emptyHint = document.getElementById('historyEmptyHint');
    if (!container) return;

    const q = (document.getElementById('historySearch')?.value || '').toLowerCase().trim();
    const sortMode = document.getElementById('historySort')?.value || 'newest';
    const filterMode = document.getElementById('historyFilter')?.value || 'all';

    let list = records.slice();
    if (q) list = list.filter((r) => r.prompt.toLowerCase().includes(q));
    if (filterMode === 'favorites') list = list.filter((r) => r.favorite);
    list.sort((a, b) => sortMode === 'newest' ? b.createdAt - a.createdAt : a.createdAt - b.createdAt);

    container.innerHTML = '';
    emptyHint.classList.toggle('hidden', list.length > 0);

    const groups = new Map();
    list.forEach((rec) => {
      const label = Utils.dateGroupLabel(rec.createdAt);
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label).push(rec);
    });

    groups.forEach((items, label) => {
      const group = document.createElement('div');
      group.className = 'history-group';
      group.innerHTML = `<div class="history-group__label">${label}</div>`;
      const masonry = document.createElement('div');
      masonry.className = 'masonry';
      items.forEach((rec) => masonry.appendChild(Gallery.createCard(rec, items, items.indexOf(rec))));
      group.appendChild(masonry);
      container.appendChild(group);
    });
  }

  return { init, add, getAll, getById, remove, toggleFavorite, render };
})();
