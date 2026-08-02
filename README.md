# J.A.R.V.I.S. — Your Personal AI Assistant

> *"At your service, Sir."*

A full personal AI assistant website inspired by Tony Stark's J.A.R.V.I.S. — not just a chatbot: it has **real tools**, **HUD panels**, **wake word**, **timers**, **long-term memory**, and a cinematic sci-fi interface.

## ✨ Features

### 🤖 AI Core
- Streaming AI chat (SSE) with a witty British-butler JARVIS personality
- Powered by **Google Gemini** (your own AI Studio key) with automatic fallback to any OpenAI-compatible endpoint
- **Real function-calling tools** the AI uses autonomously (parallel calls supported):

  | Tool | Source |
  |---|---|
  | 🌦 Weather + 4-day forecast | Open-Meteo |
  | 📰 News headlines (6 topics) | BBC RSS |
  | 🖥 Tech feed | Hacker News API |
  | 🔎 Live web search | DuckDuckGo |
  | 📚 Wikipedia summaries | Wikipedia REST |
  | 📈 Crypto prices | CoinGecko |
  | 💱 Currency conversion | Frankfurter |
  | 😄 Jokes | Joke API |
  | 📋 Persistent task list | Local JSON store |
  | 🧠 Long-term memory about you | Local JSON store |

- Tool activity shown live in chat as glowing status chips
- Memories are injected into the system prompt — JARVIS actually remembers you
- Automatic retry with backoff on rate limits

### 🖥 HUD Interface
- Arc-reactor boot sequence + WebAudio sound effects (no audio files)
- Particle-network animated background
- Side panels: **Atmospherics** (weather), **Mission Objectives** (tasks with add/complete/delete), **Global Feed** (news), **Memory Banks**, **Diagnostics**
- ⚙ Settings: your name, home city, sounds — persisted server-side

### 🎙 Voice
- Push-to-talk dictation (Web Speech API)
- Spoken replies in a British voice (toggleable)
- **Wake word**: arm 👂 WAKE and just say *"Jarvis"*

### ⏱ Utilities
- Timers/alarms: `/timer 5m tea` or naturally — *"set a timer for 10 minutes"* — with alarm sound + voice alert
- Slash commands: `/help`, `/clear`, `/timer`, `/settings`
- Quick protocol buttons: Daily Briefing, Weather, News, Tasks, Tech Feed, Markets, Humor

## 🚀 Quick Start

```bash
npm install

# Configure AI (pick one):
echo "GEMINI_API_KEY=your_google_ai_studio_key" > .env   # preferred
# or set OPENAI_API_KEY / OPENAI_BASE_URL env vars

npm start   # → http://localhost:3000
```

## 📡 API

| Endpoint | Method | Description |
|---|---|---|
| `/api/chat` | POST | Streaming chat w/ tool-calling loop (SSE) |
| `/api/health` | GET | Status, model, uptime |
| `/api/panel/weather?city=` | GET | Weather panel data |
| `/api/panel/news?topic=` | GET | News panel data |
| `/api/panel/hn` | GET | Hacker News top stories |
| `/api/panel/crypto` | GET | Crypto prices |
| `/api/tasks` | GET/POST | List / add tasks |
| `/api/tasks/:id` | PATCH/DELETE | Update / delete task |
| `/api/memories` | GET/POST | List / add memories |
| `/api/memories/:id` | DELETE | Forget memory |
| `/api/settings` | GET/POST | User settings |

## 📁 Structure

```
├── server/
│   ├── index.js    # Express + streaming chat + tool-calling loop + REST APIs
│   ├── tools.js    # 10 real tools + OpenAI function schemas
│   └── store.js    # JSON persistence (tasks/memories/settings)
├── public/
│   ├── index.html  # HUD layout, panels, modal
│   ├── style.css   # Sci-fi theme
│   ├── app.js      # Chat, streaming, panels, particles, sounds
│   └── voice.js    # TTS, dictation, wake word, timers, commands
├── .env            # GEMINI_API_KEY (gitignored — never committed)
└── data/           # Runtime store (gitignored)
```

## 🔒 Security
- API key lives in `.env` (gitignored) and is used **server-side only** — never exposed to the browser or committed to git.
- All external tool APIs are free & keyless.
- Voice/wake word need Chrome or Edge.

---

*Built like Stark would — minimal dependencies, maximum capability.*
