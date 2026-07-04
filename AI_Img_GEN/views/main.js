/**
 * main.js — app bootstrap + the Generate flow.
 * Talks to the existing Flask backend (app.py) at /generate and /health.
 * Reuses those endpoints as-is; no routes were changed.
 */
(() => {
  const API_BASE = window.location.origin; // same-origin: Flask serves this page too
  const GENERATE_URL = `${API_BASE}/generate`;
  const HEALTH_URL = `${API_BASE}/health`;

  const el = (id) => document.getElementById(id);

  const promptEl = el('prompt');
  const negativePromptEl = el('negativePrompt');
  const charCountEl = el('charCount');
  const generateBtn = el('generateBtn');
  const loadingScreen = el('loadingScreen');
  const errorPanel = el('errorPanel');
  const errorMessage = el('errorMessage');
  const loadingEta = el('loadingEta');
  const loadingSkeletons = el('loadingSkeletons');

  const EXAMPLE_PROMPTS = [
    'A futuristic cityscape at sunset with flying cars and neon lights',
    'A serene mountain landscape with a crystal clear lake reflection',
    'A magical forest with glowing mushrooms and fireflies at night',
    'An astronaut exploring a colorful alien planet, cinematic lighting',
    'A cozy coffee shop interior with warm lighting and plants',
    'A hand-thrown ceramic bowl on a wooden table, soft studio light',
    'An underwater temple ruin with shafts of light through the water'
  ];

  const TEMPLATES = {
    cinematic: ', cinematic lighting, dramatic shadows, 35mm film, shallow depth of field',
    product: ', studio product photography, softbox lighting, clean background, high detail',
    portrait: ', portrait photography, natural light, shallow depth of field, sharp focus on eyes',
    landscape: ', wide angle landscape, golden hour, atmospheric, highly detailed',
    anime: ', anime style, vibrant colors, cel shading, detailed line art',
    isometric: ', isometric illustration, clean vector style, soft shadows, pastel palette'
  };

  let isGenerating = false;
  let abortController = null;

  // ---------------------------------------------------------------- init
  function init() {
    Toast.init();
    Modal.init();
    Sidebar.init();
    Settings.init();
    History.init();
    Gallery.init();

    bindPromptConsole();
    bindAdvancedSettings();
    bindGenerate();
    bindRegenerateEvents();
    checkHealth();
    setInterval(checkHealth, 30000);
    initParticles();
  }

  // ------------------------------------------------------- prompt console
  function bindPromptConsole() {
    promptEl.addEventListener('input', () => {
      charCountEl.textContent = promptEl.value.length;
    });

    el('clearPromptBtn').addEventListener('click', () => {
      promptEl.value = '';
      charCountEl.textContent = '0';
      promptEl.focus();
    });

    el('randomPromptBtn').addEventListener('click', () => {
      promptEl.value = EXAMPLE_PROMPTS[Math.floor(Math.random() * EXAMPLE_PROMPTS.length)];
      charCountEl.textContent = promptEl.value.length;
    });

    // Rule-based prompt enhancer. There is no /enhance backend endpoint,
    // so this runs entirely client-side and preserves user intent by
    // only appending quality/clarity modifiers rather than rewriting text.
    el('enhancePromptBtn').addEventListener('click', () => {
      const original = promptEl.value.trim();
      if (!original) { Toast.warning('Write a prompt first'); return; }
      const additions = [];
      if (!/\b(lighting|light)\b/i.test(original)) additions.push('beautiful lighting');
      if (!/\b(detail|detailed)\b/i.test(original)) additions.push('highly detailed');
      if (!/\b(resolution|4k|8k|hd)\b/i.test(original)) additions.push('sharp focus');
      if (!/\b(realistic|photo|photograph)\b/i.test(original)) additions.push('cinematic composition');
      promptEl.value = additions.length ? `${original}, ${additions.join(', ')}` : original;
      charCountEl.textContent = promptEl.value.length;
      Toast.success('Prompt enhanced');
    });

    el('voiceInputBtn').addEventListener('click', () => {
      Toast.info('Voice input is a UI placeholder in this build');
    });

    document.querySelectorAll('.chip[data-template]').forEach((chip) => {
      chip.addEventListener('click', () => {
        const suffix = TEMPLATES[chip.dataset.template];
        if (!suffix) return;
        promptEl.value = promptEl.value.trim() ? promptEl.value.trim() + suffix : 'A scene' + suffix;
        charCountEl.textContent = promptEl.value.length;
      });
    });

    promptEl.addEventListener('keydown', (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') handleGenerate();
    });
  }

  // ----------------------------------------------------- advanced settings
  function bindAdvancedSettings() {
    const steps = el('steps'), stepsValue = el('stepsValue');
    steps.addEventListener('input', () => { stepsValue.textContent = steps.value; });

    const cfg = el('cfgScale'), cfgValue = el('cfgValue');
    cfg.addEventListener('input', () => { cfgValue.textContent = parseFloat(cfg.value).toFixed(1); });

    const randomSeedToggle = el('randomSeedToggle');
    const seedInput = el('seed');
    randomSeedToggle.addEventListener('change', () => {
      seedInput.disabled = randomSeedToggle.checked;
      if (randomSeedToggle.checked) seedInput.value = '';
    });
    seedInput.disabled = randomSeedToggle.checked;

    // Apply saved default aspect ratio on load.
    const settings = Settings.get();
    const aspectSelect = el('aspectRatio');
    if (settings.defaultAspect) aspectSelect.value = settings.defaultAspect;
    if (settings.defaultQuality) el('qualitySelect').value = settings.defaultQuality;
  }

  function currentDimensions() {
    const opt = el('aspectRatio').selectedOptions[0];
    return { width: parseInt(opt.dataset.w, 10), height: parseInt(opt.dataset.h, 10) };
  }

  // -------------------------------------------------------------- backend
  async function checkHealth() {
    const dot = el('statusDot'), text = el('statusText');
    try {
      const res = await fetch(HEALTH_URL, { method: 'GET' });
      const data = await res.json();
      dot.className = 'status-dot is-online';
      text.textContent = data.api_key_set ? 'Backend ready (API key set)' : 'Backend ready';
    } catch (e) {
      dot.className = 'status-dot is-offline';
      text.textContent = 'Backend offline';
    }
  }

  // -------------------------------------------------------------- generate
  function bindGenerate() {
    generateBtn.addEventListener('click', (e) => {
      rippleAt(e);
      handleGenerate();
    });
    el('cancelGenerateBtn').addEventListener('click', () => {
      if (abortController) abortController.abort();
    });
    el('errorRetryBtn').addEventListener('click', () => {
      errorPanel.classList.add('hidden');
      handleGenerate();
    });
  }

  function rippleAt(e) {
    const btn = generateBtn;
    const ripple = btn.querySelector('.btn--generate__ripple');
    const rect = btn.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    ripple.style.width = ripple.style.height = `${size}px`;
    ripple.style.left = `${(e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2}px`;
    ripple.style.top = `${(e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2}px`;
    ripple.classList.remove('is-animating');
    void ripple.offsetWidth;
    ripple.classList.add('is-animating');
  }

  function readGenerationParams() {
    const { width, height } = currentDimensions();
    const randomSeedOn = el('randomSeedToggle').checked;
    const seedVal = el('seed').value;
    return {
      prompt: promptEl.value.trim(),
      negativePrompt: negativePromptEl.value.trim(),
      width, height,
      steps: parseInt(el('steps').value, 10),
      cfg: parseFloat(el('cfgScale').value),
      seed: randomSeedOn || seedVal === '' ? null : parseInt(seedVal, 10),
      style: el('imageStyle').value,
      model: el('modelSelect').value,
      scheduler: el('scheduler').value,
      quality: el('qualitySelect').value,
      safetyFilter: el('safetyFilter').checked,
      numImages: Math.min(4, Math.max(1, parseInt(el('numImages').value, 10) || 1))
    };
  }

  async function handleGenerate() {
    if (isGenerating) return;
    const params = readGenerationParams();

    if (!params.prompt) {
      Toast.error('Please enter a prompt to generate an image');
      promptEl.focus();
      return;
    }
    if (params.prompt.length < 3) {
      Toast.error('Prompt is too short — please provide more detail');
      return;
    }

    isGenerating = true;
    setGeneratingState(true, params.numImages);

    const results = [];
    let failure = null;

    for (let i = 0; i < params.numImages; i++) {
      if (!isGenerating) break; // cancelled
      try {
        const seedForThisImage = params.seed !== null ? params.seed + i : null;
        const image = await requestImage(params, seedForThisImage);
        results.push({ image, seed: seedForThisImage });
      } catch (err) {
        if (err.name === 'AbortError') { failure = { aborted: true }; break; }
        failure = { message: err.message };
        break;
      }
    }

    if (results.length) {
      results.forEach(({ image, seed }) => {
        const record = {
          id: Utils.uid(),
          prompt: params.prompt,
          negativePrompt: params.negativePrompt,
          image,
          width: params.width,
          height: params.height,
          steps: params.steps,
          cfg: params.cfg,
          seed,
          style: params.style,
          model: params.model,
          scheduler: params.scheduler,
          quality: params.quality,
          favorite: false,
          createdAt: Date.now(),
          genTimeMs: null
        };
        const settings = Settings.get();
        if (settings.autosave !== false) {
          History.add(record);
          Gallery.markSession(record.id);
        }
      });
      Gallery.renderSession();
      Toast.success(results.length > 1 ? `${results.length} images generated` : 'Image generated successfully!');
    }

    if (failure && !failure.aborted) {
      showError(failure.message || 'Something went wrong while generating your image.');
    }

    isGenerating = false;
    setGeneratingState(false);
  }

  async function requestImage(params, seed) {
    abortController = new AbortController();
    const payload = {
      prompt: params.prompt,
      width: params.width,
      height: params.height,
      steps: params.steps,
      // The fields below are optional extensions the backend accepts in
      // addition to its original prompt/width/height/steps contract —
      // see the commented additions in app.py. Older backends that
      // don't read them will simply ignore the extra keys.
      negative_prompt: params.negativePrompt || undefined,
      guidance_scale: params.cfg,
      seed: seed ?? undefined
    };

    const res = await fetch(GENERATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: abortController.signal
    });

    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.message || errData.error || `Server error: ${res.status}`);
    }
    const data = await res.json();
    if (!data.image) throw new Error('No image data received from server');
    return `data:image/png;base64,${data.image}`;
  }

  function setGeneratingState(loading, numImages = 1) {
    generateBtn.disabled = loading;
    generateBtn.querySelector('.btn--generate__label').innerHTML = loading
      ? '<span class="spinner-small"></span> Generating...'
      : `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg> Generate`;

    if (loading) {
      errorPanel.classList.add('hidden');
      loadingScreen.classList.remove('hidden');
      loadingEta.textContent = `Estimated time: ~${20 * numImages}s`;
      loadingSkeletons.innerHTML = Array.from({ length: numImages }).map(() => '<div class="skeleton"></div>').join('');
    } else {
      loadingScreen.classList.add('hidden');
    }
  }

  function showError(message) {
    loadingScreen.classList.add('hidden');
    errorPanel.classList.remove('hidden');
    errorMessage.textContent = message;
  }

  // ------------------------------------------------------------ regenerate
  function bindRegenerateEvents() {
    document.addEventListener('LUMIXA:regenerate', (e) => {
      const rec = e.detail;
      Sidebar.setView('generate');
      promptEl.value = rec.prompt;
      negativePromptEl.value = rec.negativePrompt || '';
      charCountEl.textContent = promptEl.value.length;
      if (rec.seed != null) {
        el('randomSeedToggle').checked = false;
        el('seed').disabled = false;
        el('seed').value = rec.seed;
      }
      window.scrollTo({ top: 0, behavior: 'smooth' });
      handleGenerate();
    });
  }

  // -------------------------------------------------------- ambient canvas
  function initParticles() {
    const canvas = el('particleCanvas');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let particles = [];

    function resize() {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    }

    function makeParticles() {
      const count = Math.min(60, Math.floor((canvas.width * canvas.height) / 26000));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.6 + 0.4,
        vx: (Math.random() - 0.5) * 0.15,
        vy: (Math.random() - 0.5) * 0.15,
        a: Math.random() * 0.5 + 0.1
      }));
    }

    function tick() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(124, 92, 255, ${p.a})`;
        ctx.fill();
      });
      requestAnimationFrame(tick);
    }

    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    resize();
    makeParticles();
    window.addEventListener('resize', Utils.debounce(() => { resize(); makeParticles(); }, 300));
    if (!prefersReducedMotion) requestAnimationFrame(tick);
  }

  document.addEventListener('DOMContentLoaded', init);
})();
