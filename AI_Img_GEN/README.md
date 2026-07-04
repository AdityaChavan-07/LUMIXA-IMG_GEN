# Lumixa — AI Image Generator

Lumixa is a dark, glassmorphic, futuristic web app for generating images from text prompts. It's a Flask backend paired with a vanilla HTML/CSS/JS frontend — no build step, no framework, no local GPU required.

Image generation is powered by **[Pollinations.ai](https://pollinations.ai)**, which is free and works without an API key.

![status](https://img.shields.io/badge/backend-Flask-black) ![status](https://img.shields.io/badge/image_model-Pollinations.ai-7C5CFF) ![status](https://img.shields.io/badge/frontend-vanilla_JS-00E5FF)

---

## Features

- **Prompt console** — large auto-expanding textarea, character counter, negative prompt, one-click prompt enhancer, random prompt, prompt style templates
- **Advanced settings** — aspect ratio presets, image count, sampling steps, CFG scale, seed (with random toggle), style, model (`flux` / `turbo` / `flux-realism`), scheduler, quality, safety filter
- **Generate button** — animated ripple, loading state, disables while generating
- **Loading screen** — animated progress rings, ETA estimate, skeleton placeholders, cancelable requests
- **Gallery** — Pinterest-style masonry grid with lazy-loaded images, hover actions (download, share, copy prompt, regenerate, delete, favorite, upscale placeholder)
- **Fullscreen image viewer** — zoom, pan, keyboard shortcuts, full metadata panel, before/after-ready modal panel
- **History** — search, sort, filter by favorites, grouped by date, restore a previous prompt, regenerate, delete
- **Favorites** — every image you heart shows up here
- **Settings** — theme, accent color, language, default model/quality/aspect ratio, autosave, notifications, animation toggle
- **Toast notifications** — success, warning, error, info states
- **Fully responsive** — desktop, laptop, tablet, phone, foldables, ultra-wide
- **Accessible** — keyboard navigation, ARIA labels, visible focus states, semantic HTML, respects `prefers-reduced-motion`
- **CSS-only animations** — no animation libraries; fades, slides, scales, blur, ripple, hover-lift, shimmer, gradient motion, image reveal

---

## Tech stack

| Layer     | Tech                                                    |
|-----------|----------------------------------------------------------|
| Backend   | Python, Flask, Flask-CORS, Requests, python-dotenv       |
| Image API | [Pollinations.ai](https://pollinations.ai) (`flux` model by default) |
| Frontend  | Vanilla HTML5, CSS3 (custom properties, no framework), modular JavaScript (ES6+) |
| Storage   | Browser `localStorage` — history, favorites, gallery, and settings all live client-side |
| Fonts     | Sora (display), Inter (body), JetBrains Mono (technical/metadata values) |

No React, no build tools, no bundler — open `app.py`, run it, and go.

---

## Project structure

```
python/
├── app.py              # Flask backend — /generate and /health routes
├── requirements.txt    # Python dependencies
├── .env.example        # Optional Pollinations API key template
└── views/
    ├── index.html       # App shell — sidebar, all views, modal, toasts
    └── styles.css   # Design system: tokens, layout, components, responsive, a11y
    ├── utils.js      # Shared helpers (storage, formatting, debounce, clipboard)
    ├── toast.js      # Toast notification system
    ├──modal.js      # Fullscreen image viewer (zoom/pan/keyboard nav/metadata)
    ├── sidebar.js    # Sidebar collapse, mobile nav, view routing, storage meter
    ├── settings.js   # Appearance + default generation preferences
    ├── history.js    # Central data store (localStorage) + History view
    ├── gallery.js    # Card rendering + masonry grids (Session/Gallery/Favorites)
    └── main.js       # App bootstrap + the Generate flow
```

---

## Getting started

### 1. Install dependencies

```bash
cd python
pip install -r requirements.txt
```

### 2. (Optional) Configure Pollinations API key

Lumixa works out of the box with **no API key** — Pollinations' free tier is anonymous but rate-limited. If you want higher limits, get a free key at [enter.pollinations.ai](https://enter.pollinations.ai) and add it:

```bash
cp .env.example .env
```

```env
POLLINATIONS_API_KEY=your_key_here
```

### 3. Run the server

```bash
python app.py
```

### 4. Open the app

Visit **http://localhost:5000** in your browser.

---

## How it works

- The frontend posts to `POST /generate` with a JSON body: `prompt`, `width`, `height`, `steps`, and optionally `negative_prompt`, `guidance_scale`, `seed`, `model`.
- The Flask backend forwards the prompt and parameters to Pollinations.ai's image endpoint (`GET https://image.pollinations.ai/prompt/{prompt}`), receives the raw image bytes, and returns them to the frontend as base64 in a JSON response.
- `GET /health` reports backend status and whether an API key is configured.
- Everything else — history, favorites, gallery, and settings — is handled entirely in the browser via `localStorage`. The backend has no database and no persistence endpoints by design.

---

## Keyboard shortcuts

| Action                  | Shortcut         |
|--------------------------|------------------|
| Generate                | `Ctrl` / `Cmd` + `Enter` |
| Close viewer / modal    | `Esc`            |
| Next image in viewer    | `→`              |
| Previous image in viewer| `←`              |
| Zoom in / out            | `+` / `-`        |

---

## Notes & limitations

- Voice input is a UI placeholder (no speech-to-text backend wired up).
- "Upscale" is a placeholder — there's no upscaling endpoint connected yet.
- The prompt enhancer is a simple rule-based client-side helper (no LLM call) that appends quality modifiers without rewriting your original wording.
- Sampling steps/CFG scale are collected in the UI for a consistent experience, but Pollinations' hosted `flux` model doesn't expose fine-grained step control the way a local diffusers pipeline would.
- Images are stored as base64 in `localStorage`, which is fine for casual use but will hit browser storage limits with a very large gallery. For production use, swap this for real backend persistence (e.g., a database + object storage).

---

## License

This project is provided as-is for personal and educational use.
