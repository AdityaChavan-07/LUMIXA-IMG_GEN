# ✨ Lumixa
LUMIXA — AI Image Generator https://share.google/lu9wj2jxjBynbqBYY

> **A self-hosted AI image generation studio powered by Pollinations.ai.**

Lumixa is a lightweight, modern AI image generation application that transforms text prompts into stunning images in seconds. It combines a minimal Flask backend with a dependency-free vanilla JavaScript frontend, delivering a polished, commercial-quality experience without React, build tools, or complex deployment.

Simply describe what you want, click **Generate**, and watch Lumixa bring your ideas to life.

---

## 🚀 Features

### 🎨 AI Image Generation
- Generate images from natural language prompts
- Powered by the free **Pollinations.ai** API
- No signup required
- No API key required
- Optional API key support for higher rate limits

### ⚡ Lightweight Architecture
- Flask backend
- Vanilla HTML, CSS & JavaScript
- No React
- No Vite
- No Webpack
- No build process
- Easy to understand and customize

### 🌙 Modern UI
- Dark glassmorphism design
- Violet & cyan neon accents
- Animated gradient prompt console
- Smooth CSS-only animations
- Responsive layout
- Mobile friendly

### 🖼 Gallery
- Pinterest-style masonry layout
- Infinite scrolling experience
- Fullscreen image viewer
- Zoom & pan support
- Keyboard shortcuts

### ❤️ Image Management
- Save favorites
- Search previous generations
- Date-grouped history
- Copy original prompt
- Regenerate images
- Download images
- Share generated artwork

### ⚙ Settings
- Theme customization
- Generation defaults
- Persistent preferences
- Local browser storage

---

# 🏗 Architecture

```
                +----------------------+
                |      Frontend        |
                | HTML • CSS • JS      |
                +----------+-----------+
                           |
                           |
                      /generate
                           |
                +----------v-----------+
                |      Flask API       |
                +----------+-----------+
                           |
                           |
                  Pollinations.ai API
                           |
                    Generated Image
```

The backend intentionally stays minimal.

It exposes only two endpoints:

- `/generate`
- `/health`

Everything else—including history, favorites, gallery, and user preferences—is stored locally in the browser using **localStorage**.


---

# 🚀 Getting Started

## 1. Clone the repository

```bash
git clone https://github.com/yourusername/lumixa.git
cd lumixa
```

---

## 2. Install dependencies

```bash
pip install -r requirements.txt
```

---

## 3. Run the application

```bash
python app.py
```

---

## 4. Open your browser

```
http://127.0.0.1:5000
```

Start generating AI images immediately.

---

# 🔌 API

## POST `/generate`

Generates an image from a text prompt.

### Example Request

```json
{
  "prompt": "A futuristic cyberpunk city at sunset"
}
```

---

## GET `/health`

Health check endpoint.

Example response:

```json
{
    "status": "ok"
}
```

---

# 💾 Local Storage

Lumixa stores the following locally in your browser:

- Generation history
- Favorites
- Gallery metadata
- User settings
- Theme preferences

No database setup is required.

---

# 🎯 Why Lumixa?

Lumixa was built around a simple philosophy:

> **Keep the backend tiny. Make the frontend beautiful.**

Instead of introducing unnecessary complexity with frameworks and databases, Lumixa focuses on delivering an elegant developer experience with minimal setup.

Perfect for:

- Learning AI API integration
- Building generative AI projects
- Rapid prototyping
- Personal AI image generation
- Frontend experimentation
- Flask beginners

---

# 🛠 Tech Stack

### Backend

- Python
- Flask

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### AI

- Pollinations.ai

### Storage

- Browser localStorage

---

# 📸 Screenshots

> Add screenshots of your application here.

- Home
- Image Generation
- Gallery
- Fullscreen Viewer
- Settings

---

# 🌟 Highlights

- 🚀 No API key required
- 🎨 AI image generation
- ⚡ Lightweight Flask backend
- 💎 Premium glassmorphism UI
- ❤️ Favorites
- 🕒 Searchable history
- 🖼 Masonry gallery
- 🔍 Fullscreen viewer
- 📱 Responsive design
- 💾 Local storage
- 🔥 Zero build tools
- 🧩 Easy to customize

---

# 🤝 Contributing

Contributions, feature requests, and improvements are welcome.

Feel free to fork the repository and submit a pull request.

---

# 📄 License

This project is licensed under the MIT License.

---

# ⭐ Support

If you found Lumixa helpful, consider giving the repository a **⭐ Star** on GitHub.

It helps others discover the project and supports future development.

---

<p align="center">
Built with ❤️ using Flask, Vanilla JavaScript, and Pollinations.ai
</p>
