/**
 * gallery.js — masonry rendering + per-card actions (download, share,
 * copy prompt, regenerate, delete, favorite, upscale placeholder).
 * Reads from History (the persisted store) and reuses one card
 * template across the Session grid, Gallery view, Favorites view,
 * and History view.
 */
const Gallery = (() => {
  const sessionIds = []; // images generated during this page load, in-memory only

  function markSession(id) { sessionIds.unshift(id); }

  function icon(name) {
    const icons = {
      download: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 3v12m0 0l-4-4m4 4l4-4M4 21h16"/></svg>',
      share: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="M8.6 13.5l6.8 4M15.4 6.5l-6.8 4"/></svg>',
      copy: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15H4a1 1 0 01-1-1V4a1 1 0 011-1h10a1 1 0 011 1v1"/></svg>',
      regen: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 12a9 9 0 11-3-6.7M21 3v6h-6"/></svg>',
      delete: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/></svg>',
      heart: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="1"><path d="M12 21s-7-4.35-9.5-8.5C.8 9 2.2 5.5 5.6 5c2-.3 3.7.7 4.4 2 .7-1.3 2.4-2.3 4.4-2 3.4.5 4.8 4 3.1 7.5C19 16.65 12 21 12 21z"/></svg>',
      heartOutline: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 21s-7-4.35-9.5-8.5C.8 9 2.2 5.5 5.6 5c2-.3 3.7.7 4.4 2 .7-1.3 2.4-2.3 4.4-2 3.4.5 4.8 4 3.1 7.5C19 16.65 12 21 12 21z"/></svg>',
      upscale: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H3v5M21 8V3h-5M3 16v5h5M16 21h5v-5"/></svg>'
    };
    return icons[name] || '';
  }

  function createCard(rec, list, index) {
    const card = document.createElement('article');
    card.className = 'card';
    card.innerHTML = `
      <div class="card__media">
        <img src="${rec.image}" alt="${Utils.escapeHtml(rec.prompt)}" loading="lazy">
        <div class="card__overlay">
          <div class="card__actions">
            <button class="icon-btn" data-action="favorite" aria-label="Toggle favorite">${rec.favorite ? icon('heart') : icon('heartOutline')}</button>
            <button class="icon-btn" data-action="download" aria-label="Download">${icon('download')}</button>
            <button class="icon-btn" data-action="share" aria-label="Share">${icon('share')}</button>
            <button class="icon-btn" data-action="copy" aria-label="Copy prompt">${icon('copy')}</button>
            <button class="icon-btn" data-action="upscale" aria-label="Upscale">${icon('upscale')}</button>
            <button class="icon-btn" data-action="regen" aria-label="Regenerate">${icon('regen')}</button>
            <button class="icon-btn" data-action="delete" aria-label="Delete">${icon('delete')}</button>
          </div>
        </div>
      </div>
      <div class="card__body">
        <p class="card__prompt">${Utils.escapeHtml(rec.prompt)}</p>
        <div class="card__meta">
          <span>${rec.width}&times;${rec.height}</span>
          <span>${Utils.escapeHtml(rec.model || 'flux-dev')}</span>
          <span>${rec.genTimeMs ? `${(rec.genTimeMs / 1000).toFixed(1)}s` : ''}</span>
        </div>
      </div>
    `;

    card.querySelector('img').addEventListener('click', () => Modal.open(list, index));

    card.querySelector('[data-action="favorite"]').addEventListener('click', (e) => {
      e.stopPropagation();
      History.toggleFavorite(rec.id);
    });
    card.querySelector('[data-action="download"]').addEventListener('click', (e) => {
      e.stopPropagation();
      Utils.downloadDataUrl(rec.image, `LUMIXA-${rec.id}.png`);
      Toast.success('Downloaded');
    });
    card.querySelector('[data-action="share"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      if (navigator.share) {
        try { await navigator.share({ text: rec.prompt, title: 'LUMIXA image' }); }
        catch (err) { /* user cancelled */ }
      } else {
        const ok = await Utils.copyText(rec.prompt);
        Toast[ok ? 'success' : 'error'](ok ? 'Link sharing isn\u2019t available here — prompt copied instead' : 'Could not share');
      }
    });
    card.querySelector('[data-action="copy"]').addEventListener('click', async (e) => {
      e.stopPropagation();
      const ok = await Utils.copyText(rec.prompt);
      Toast[ok ? 'success' : 'error'](ok ? 'Prompt copied' : 'Could not copy prompt');
    });
    card.querySelector('[data-action="upscale"]').addEventListener('click', (e) => {
      e.stopPropagation();
      Toast.info('Upscaling isn\u2019t wired up to a backend endpoint yet — coming soon');
    });
    card.querySelector('[data-action="regen"]').addEventListener('click', (e) => {
      e.stopPropagation();
      document.dispatchEvent(new CustomEvent('LUMIXA:regenerate', { detail: rec }));
    });
    card.querySelector('[data-action="delete"]').addEventListener('click', (e) => {
      e.stopPropagation();
      History.remove(rec.id);
      renderAll();
      Toast.info('Deleted');
    });

    return card;
  }

  function renderGrid(containerId, emptyHintId, list) {
    const container = document.getElementById(containerId);
    const emptyHint = document.getElementById(emptyHintId);
    if (!container) return;
    container.innerHTML = '';
    emptyHint.classList.toggle('hidden', list.length > 0);
    list.forEach((rec, i) => container.appendChild(createCard(rec, list, i)));
  }

  function renderSession() {
    const list = sessionIds.map((id) => History.getById(id)).filter(Boolean);
    renderGrid('sessionGrid', 'sessionEmptyHint', list);
  }

  function renderGalleryView() {
    renderGrid('galleryGrid', 'galleryEmptyHint', History.getAll());
  }

  function renderFavoritesView() {
    renderGrid('favoritesGrid', 'favoritesEmptyHint', History.getAll().filter((r) => r.favorite));
  }

  function renderAll() {
    renderSession();
    renderGalleryView();
    renderFavoritesView();
  }

  function init() {
    document.addEventListener('LUMIXA:history-changed', renderAll);
    document.addEventListener('LUMIXA:view-changed', (e) => {
      if (e.detail === 'gallery') renderGalleryView();
      if (e.detail === 'favorites') renderFavoritesView();
    });
    renderAll();
  }

  return { init, createCard, markSession, renderSession, renderAll };
})();
