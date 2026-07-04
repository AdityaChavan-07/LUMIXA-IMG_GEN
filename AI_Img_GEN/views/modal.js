/**
 * modal.js — fullscreen image viewer: zoom, pan, keyboard shortcuts,
 * metadata panel, and quick actions (download / copy prompt / regenerate).
 * Regenerate is delegated back to main.js via a "LUMIXA:regenerate" event,
 * since the actual /generate call lives there.
 */
const Modal = (() => {
  let overlay, stage, img, meta, prevBtn, nextBtn, closeBtn;
  let list = [];
  let index = 0;
  let scale = 1;
  let pan = { x: 0, y: 0 };
  let dragging = false;
  let dragStart = { x: 0, y: 0 };

  function init() {
    overlay = document.getElementById('imageModal');
    stage = document.getElementById('modalStage');
    img = document.getElementById('modalImage');
    meta = document.getElementById('modalMeta');
    prevBtn = document.getElementById('modalPrevBtn');
    nextBtn = document.getElementById('modalNextBtn');
    closeBtn = document.getElementById('modalCloseBtn');

    closeBtn.addEventListener('click', close);
    overlay.addEventListener('click', (e) => { if (e.target === overlay) close(); });
    prevBtn.addEventListener('click', () => step(-1));
    nextBtn.addEventListener('click', () => step(1));

    document.getElementById('modalDownloadBtn').addEventListener('click', () => {
      const rec = current();
      if (rec) Utils.downloadDataUrl(rec.image, `LUMIXA-${rec.id}.png`);
    });
    document.getElementById('modalCopyBtn').addEventListener('click', async () => {
      const rec = current();
      if (rec) {
        const ok = await Utils.copyText(rec.prompt);
        Toast[ok ? 'success' : 'error'](ok ? 'Prompt copied' : 'Could not copy prompt');
      }
    });
    document.getElementById('modalRegenBtn').addEventListener('click', () => {
      const rec = current();
      if (rec) document.dispatchEvent(new CustomEvent('LUMIXA:regenerate', { detail: rec }));
      close();
    });

    document.addEventListener('keydown', (e) => {
      if (overlay.classList.contains('hidden')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowRight') step(1);
      if (e.key === 'ArrowLeft') step(-1);
      if (e.key === '+' || e.key === '=') zoom(0.2);
      if (e.key === '-') zoom(-0.2);
    });

    stage.addEventListener('wheel', (e) => {
      e.preventDefault();
      zoom(e.deltaY < 0 ? 0.12 : -0.12);
    }, { passive: false });

    stage.addEventListener('pointerdown', (e) => {
      dragging = true;
      dragStart = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      img.style.cursor = 'grabbing';
    });
    window.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      pan = { x: e.clientX - dragStart.x, y: e.clientY - dragStart.y };
      applyTransform();
    });
    window.addEventListener('pointerup', () => { dragging = false; img.style.cursor = 'grab'; });
  }

  function current() { return list[index]; }

  function applyTransform() {
    img.style.transform = `translate(${pan.x}px, ${pan.y}px) scale(${scale})`;
  }

  function zoom(delta) {
    scale = Math.min(4, Math.max(1, scale + delta));
    if (scale === 1) pan = { x: 0, y: 0 };
    applyTransform();
  }

  function render() {
    const rec = current();
    if (!rec) return;
    scale = 1; pan = { x: 0, y: 0 };
    applyTransform();
    img.src = rec.image;
    img.alt = rec.prompt;

    meta.innerHTML = `
      <div><dt>Prompt</dt><dd>${Utils.escapeHtml(rec.prompt)}</dd></div>
      ${rec.negativePrompt ? `<div><dt>Negative prompt</dt><dd>${Utils.escapeHtml(rec.negativePrompt)}</dd></div>` : ''}
      <div><dt>Seed</dt><dd>${rec.seed ?? 'random'}</dd></div>
      <div><dt>Model</dt><dd>${Utils.escapeHtml(rec.model || 'flux-dev')}</dd></div>
      <div><dt>Resolution</dt><dd>${rec.width}&times;${rec.height}</dd></div>
      <div><dt>Steps / CFG</dt><dd>${rec.steps} / ${rec.cfg}</dd></div>
      <div><dt>Generated</dt><dd>${Utils.formatDate(rec.createdAt)}</dd></div>
    `;

    prevBtn.style.visibility = list.length > 1 ? 'visible' : 'hidden';
    nextBtn.style.visibility = list.length > 1 ? 'visible' : 'hidden';
  }

  function step(dir) {
    if (!list.length) return;
    index = (index + dir + list.length) % list.length;
    render();
  }

  function open(records, startIndex = 0) {
    list = records;
    index = startIndex;
    overlay.classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    render();
  }

  function close() {
    overlay.classList.add('hidden');
    document.body.style.overflow = '';
  }

  return { init, open, close };
})();
