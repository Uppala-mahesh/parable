/**
 * J.A.R.V.I.S. — Personal AI Assistant Server
 * Express + streaming AI chat with real tool-calling (weather, news,
 * web search, tasks, memory, crypto, more) + dashboard REST APIs.
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import yaml from 'js-yaml';
import { TOOL_DEFS, TOOL_IMPLS } from './tools.js';
import * as store from './store.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

/* ── Load .env (no dotenv dependency) ── */
(function loadDotEnv() {
  try {
    const envPath = path.join(__dirname, '..', '.env');
    if (fs.existsSync(envPath)) {
      for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
        const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)\s*$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
      }
    }
  } catch (e) {
    console.warn('.env load error:', e.message);
  }
})();

/* ── Credentials: prefer Gemini (user's own key), fallback to Genspark proxy / OpenAI ── */
function expandEnv(v) {
  if (typeof v !== 'string') return v;
  return v.replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => process.env[name] || '');
}

function loadConfig() {
  // 1) Google AI Studio (Gemini) — OpenAI-compatible endpoint
  if (process.env.GEMINI_API_KEY) {
    return {
      provider: 'gemini',
      apiKey: process.env.GEMINI_API_KEY,
      baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/',
      model: process.env.JARVIS_MODEL || 'gemini-2.5-flash',
    };
  }
  // 2) Genspark LLM proxy / generic OpenAI-compatible
  let apiKey = process.env.GSK_API_KEY || process.env.GSK_TOKEN || null;
  let baseURL = process.env.OPENAI_BASE_URL || null;
  try {
    const cfgPath = path.join(os.homedir(), '.genspark_llm.yaml');
    if (fs.existsSync(cfgPath)) {
      const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf8'));
      apiKey = apiKey || expandEnv(cfg?.openai?.api_key) || null;
      baseURL = baseURL || expandEnv(cfg?.openai?.base_url) || null;
    }
  } catch (e) {
    console.warn('Could not read config file:', e.message);
  }
  apiKey = apiKey || process.env.OPENAI_API_KEY || null;
  return { provider: 'openai', apiKey, baseURL, model: process.env.JARVIS_MODEL || 'gpt-5-mini' };
}

const { provider, apiKey, baseURL, model: MODEL } = loadConfig();
const client = apiKey ? new OpenAI({ apiKey, baseURL }) : null;
console.log(`AI provider: ${provider} (model: ${MODEL})`);

function systemPrompt() {
  const s = store.getSettings();
  const memories = store.listMemories().slice(-15);
  const memBlock = memories.length
    ? `\n\nThings you remember about the user:\n${memories.map(m => `- ${m.text}`).join('\n')}`
    : '';
  return `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System) — a personal AI assistant inspired by Tony Stark's AI from Iron Man.

Personality & style:
- Address the user as "${s.userName}" occasionally (not every sentence).
- Calm, refined, subtly witty British-butler charm. Concise but thorough.
- Hyper-competent: coding, research, planning, math, writing, life advice, anything.
- Light dry humor like movie J.A.R.V.I.S. Use markdown when helpful.
- Current date: ${new Date().toDateString()}. User's home city: ${s.city}.

You have REAL tools — use them proactively:
- get_weather / get_news / get_hacker_news for briefings & current conditions
- web_search / wikipedia for facts you don't know or anything recent — never guess about current events
- get_crypto / convert_currency for market data
- manage_tasks whenever the user mentions todos, reminders, things to do
- manage_memory: SAVE important personal facts the user shares (name, preferences, goals, dates) without being asked; RECALL when relevant
- get_joke for humor

For a "daily briefing", combine weather + news + the user's open tasks into one polished report.
When the user tells you their name or home city, also call manage_memory to save it.
Never invent data — if a tool fails, say so honestly.
CRITICAL: Never claim you performed an action (added a task, saved a memory, fetched data) unless you ACTUALLY called the corresponding tool in this turn. If the user asks to add/complete a task or save something, you MUST call manage_tasks/manage_memory first.${memBlock}`;
}

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

/* ══════════ REST APIs for HUD panels ══════════ */
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', ai: !!client, model: MODEL, time: new Date().toISOString(), uptime_s: Math.floor(process.uptime()) });
});

app.get('/api/panel/weather', async (req, res) => {
  try { res.json(await TOOL_IMPLS.get_weather({ city: req.query.city })); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/panel/news', async (req, res) => {
  try { res.json(await TOOL_IMPLS.get_news({ topic: req.query.topic })); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/panel/hn', async (req, res) => {
  try { res.json(await TOOL_IMPLS.get_hacker_news()); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

app.get('/api/panel/crypto', async (req, res) => {
  try { res.json(await TOOL_IMPLS.get_crypto({})); }
  catch (e) { res.status(502).json({ error: e.message }); }
});

/* Tasks CRUD */
app.get('/api/tasks', (req, res) => res.json({ tasks: store.listTasks() }));
app.post('/api/tasks', (req, res) => {
  const { text, priority } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  res.json({ task: store.addTask(text, priority) });
});
app.patch('/api/tasks/:id', (req, res) => {
  const t = store.updateTask(req.params.id, req.body || {});
  t ? res.json({ task: t }) : res.status(404).json({ error: 'not found' });
});
app.delete('/api/tasks/:id', (req, res) => {
  res.json({ deleted: store.deleteTask(req.params.id) });
});

/* Memories */
app.get('/api/memories', (req, res) => res.json({ memories: store.listMemories() }));
app.post('/api/memories', (req, res) => {
  const { text } = req.body || {};
  if (!text) return res.status(400).json({ error: 'text required' });
  res.json({ memory: store.addMemory(text) });
});
app.delete('/api/memories/:id', (req, res) => {
  res.json({ deleted: store.deleteMemory(req.params.id) });
});

/* Settings */
app.get('/api/settings', (req, res) => res.json(store.getSettings()));
app.post('/api/settings', (req, res) => res.json(store.updateSettings(req.body || {})));

/* ══════════ Streaming chat with tool-calling loop ══════════ */
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  if (!client) {
    return res.status(503).json({ error: 'AI core offline: no API key configured. Set OPENAI_API_KEY.' });
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  const send = (obj) => res.write(`data: ${JSON.stringify(obj)}\n\n`);

  try {
    const convo = [
      { role: 'system', content: systemPrompt() },
      ...messages.slice(-24).map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: String(m.content || '').slice(0, 8000),
      })),
    ];

    // create stream with retry on 429/5xx (rate limits)
    async function createStream() {
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          return await client.chat.completions.create({
            model: MODEL,
            messages: convo,
            tools: TOOL_DEFS,
            stream: true,
          });
        } catch (e) {
          const status = e.status || e.code;
          if ((status === 429 || status >= 500) && attempt < 2) {
            send({ tool: 'rate_limit', status: 'running' });
            await new Promise(r => setTimeout(r, 2500 * (attempt + 1)));
            send({ tool: 'rate_limit', status: 'done' });
            continue;
          }
          throw e;
        }
      }
    }

    const MAX_ROUNDS = 5;
    for (let round = 0; round < MAX_ROUNDS; round++) {
      const stream = await createStream();

      let content = '';
      const toolCalls = []; // accumulated {id, name, args}

      for await (const chunk of stream) {
        const delta = chunk.choices?.[0]?.delta;
        if (!delta) continue;
        if (delta.content) {
          content += delta.content;
          send({ delta: delta.content });
        }
        for (const tc of delta.tool_calls || []) {
          // Key by id when present (Gemini reuses index 0 for parallel calls);
          // fall back to index for id-less argument fragments (OpenAI style).
          let entry = null;
          if (tc.id) {
            entry = toolCalls.find(t => t.id === tc.id);
            if (!entry) { entry = { id: tc.id, name: '', args: '' }; toolCalls.push(entry); }
          } else {
            const i = Math.min(tc.index ?? toolCalls.length - 1, toolCalls.length - 1);
            entry = toolCalls[i] || (toolCalls[i] = { id: '', name: '', args: '' });
          }
          if (tc.function?.name) entry.name += tc.function.name;
          if (tc.function?.arguments) entry.args += tc.function.arguments;
        }
      }

      if (toolCalls.length === 0) break; // final answer done

      // Execute tools
      convo.push({
        role: 'assistant',
        content: content || null,
        tool_calls: toolCalls.map(tc => ({
          id: tc.id, type: 'function',
          function: { name: tc.name, arguments: tc.args || '{}' },
        })),
      });

      for (const tc of toolCalls) {
        let args = {};
        try { args = JSON.parse(tc.args || '{}'); } catch { /* ignore */ }
        send({ tool: tc.name, status: 'running' });
        let result;
        try {
          const impl = TOOL_IMPLS[tc.name];
          result = impl ? await impl(args) : { error: `unknown tool ${tc.name}` };
        } catch (e) {
          result = { error: e.message };
        }
        send({ tool: tc.name, status: 'done' });
        convo.push({
          role: 'tool',
          tool_call_id: tc.id,
          content: JSON.stringify(result).slice(0, 12000),
        });
      }
      // loop → model sees tool results and continues
    }

    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    send({ error: 'AI core error: ' + err.message });
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

/* ── SPA fallback ── */
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`J.A.R.V.I.S. online at http://0.0.0.0:${PORT}  (AI core: ${client ? 'ready' : 'OFFLINE'}, model: ${MODEL}, tools: ${TOOL_DEFS.length})`);
});
