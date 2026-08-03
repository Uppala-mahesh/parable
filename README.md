# J.A.R.V.I.S. — Your Personal AI Assistant

> *"At your service, Sir."*

A website that gives you your own personal AI assistant, inspired by Tony Stark's J.A.R.V.I.S. from Iron Man — complete with an arc-reactor boot sequence, a futuristic HUD interface, streaming AI chat, and full voice interaction.

## ✨ Features

- 🤖 **AI Chat Core** — Real streaming AI responses (SSE) with a witty British-butler J.A.R.V.I.S. personality
- 🎙️ **Voice Input** — Talk to JARVIS using your microphone (Web Speech API)
- 🔊 **Voice Replies** — JARVIS speaks answers back in a British voice (toggleable)
- ⚡ **Quick Protocols** — One-tap commands: Daily Briefing, Plan My Day, Workshop Mode, Research Array, Surprise Me
- 🎬 **Boot Sequence** — Animated arc-reactor startup screen
- 🖥️ **Sci-fi HUD** — Animated grid background, glowing cyan panels, live system stats and clock
- 📱 **Responsive** — Works on desktop and mobile
- 📝 **Markdown rendering** — Code blocks, tables, lists in responses (sanitized with DOMPurify)

## 🏗️ Tech Stack

| Layer | Tech |
|---|---|
| Backend | Node.js + Express (ES modules) |
| AI | OpenAI-compatible API (`gpt-5-mini`) with SSE streaming |
| Frontend | Vanilla HTML/CSS/JS — zero build step |
| Voice | Web Speech API (recognition + synthesis) |

## 🚀 Quick Start

```bash
npm install
# Configure AI credentials (either works):
#   1. Env vars:  OPENAI_API_KEY, OPENAI_BASE_URL
#   2. File:      ~/.genspark_llm.yaml
npm start
# → http://localhost:3000
```

> **Demo mode:** If no API key is set, J.A.R.V.I.S. still runs and streams a canned
> reply — so the app is fully clickable in any deployment without a paid key.
> Add a key to unlock real AI responses.

## ☁️ Deploy (one command)

**Vercel:** `vercel --prod`  •  **Render:** connect repo, set build `npm install`, start `npm start`.
Set env `OPENAI_API_KEY` (+ optional `OPENAI_BASE_URL`) to enable the live AI core.

## 📡 API

| Endpoint | Method | Description |
|---|---|---|
| `/` | GET | JARVIS web interface |
| `/api/health` | GET | System + AI core status |
| `/api/chat` | POST | Streaming chat — body: `{ messages: [{role, content}] }`, returns SSE |

## 📁 Structure

```
├── server/index.js    # Express server + streaming chat API
├── public/
│   ├── index.html     # HUD interface
│   ├── style.css      # Iron-Man-style theme
│   └── app.js         # Chat, streaming, voice logic
└── package.json
```

## 🔒 Notes

- API key is read server-side only — never exposed to the browser.
- Chat history is kept in the browser session (trimmed to last 20 turns for the model).
- Voice input requires a browser supporting `SpeechRecognition` (Chrome/Edge recommended).

---

*Built like Stark would — minimal dependencies, maximum style.*
