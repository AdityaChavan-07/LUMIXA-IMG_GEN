/**
 * utils.js — shared helpers used across modules.
 * No backend calls here; pure client-side utilities.
 */
const Utils = (() => {

  function debounce(fn, wait = 250) {
    let t;
    return (...args) => {
      clearTimeout(t);
      t = setTimeout(() => fn(...args), wait);
    };
  }

  function uid() {
    return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
  }

  function formatBytes(bytes) {
    if (!bytes) return '0 MB';
    const mb = bytes / (1024 * 1024);
    return `${mb.toFixed(1)} MB`;
  }

  // Rough byte-size of a base64 data URL / string.
  function base64Size(str) {
    if (!str) return 0;
    const clean = str.split(',').pop() || '';
    return Math.round((clean.length * 3) / 4);
  }

  function formatDate(ts) {
    const d = new Date(ts);
    return d.toLocaleString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  }

  function dateGroupLabel(ts) {
    const d = new Date(ts);
    const now = new Date();
    const startOfDay = (date) => new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const diffDays = Math.round((startOfDay(now) - startOfDay(d)) / 86400000);
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return 'This week';
    if (diffDays < 30) return 'This month';
    return 'Earlier';
  }

  // Safe localStorage wrapper — never throws into caller.
  const storage = {
    get(key, fallback = null) {
      try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : fallback;
      } catch (e) {
        console.error('storage.get failed', key, e);
        return fallback;
      }
    },
    set(key, value) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        return true;
      } catch (e) {
        console.error('storage.set failed (quota exceeded?)', key, e);
        return false;
      }
    },
    remove(key) {
      try { localStorage.removeItem(key); } catch (e) { /* noop */ }
    }
  };

  function escapeHtml(str = '') {
    return str.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  function downloadDataUrl(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch (e) {
      return false;
    }
  }

  return { debounce, uid, formatBytes, base64Size, formatDate, dateGroupLabel, storage, escapeHtml, downloadDataUrl, copyText };
})();
