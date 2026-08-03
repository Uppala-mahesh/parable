/**
 * J.A.R.V.I.S. — Personal AI Assistant Server
 * Express server serving the frontend + streaming AI chat API.
 */
import express from 'express';
import path from 'path';
import fs from 'fs';
import os from 'os';
import { fileURLToPath } from 'url';
import OpenAI from 'openai';
import yaml from 'js-yaml';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = process.env.PORT || 3000;

// ── Load LLM credentials (env vars or ~/.genspark_llm.yaml) ──
function expandEnv(v) {
  if (typeof v !== 'string') return v;
  return v.replace(/\$\{([A-Z0-9_]+)\}/g, (_, name) => process.env[name] || '');
}

function loadConfig() {
  // Candidate keys, in priority order (Genspark sandboxes expose GSK_API_KEY)
  let apiKey = process.env.GSK_API_KEY || process.env.GSK_TOKEN || null;
  let baseURL = process.env.OPENAI_BASE_URL || null;
  try {
    const cfgPath = path.join(os.homedir(), '.genspark_llm.yaml');
    if (fs.existsSync(cfgPath)) {
      const cfg = yaml.load(fs.readFileSync(cfgPath, 'utf8'));
      const fileKey = expandEnv(cfg?.openai?.api_key);
      apiKey = apiKey || fileKey || null;
      baseURL = baseURL || expandEnv(cfg?.openai?.base_url) || null;
    }
  } catch (e) {
    console.warn('Could not read config file:', e.message);
  }
  apiKey = apiKey || process.env.OPENAI_API_KEY || null;
  return { apiKey, baseURL };
}

const { apiKey, baseURL } = loadConfig();
const client = apiKey ? new OpenAI({ apiKey, baseURL }) : null;

const SYSTEM_PROMPT = `You are J.A.R.V.I.S. (Just A Rather Very Intelligent System) — a personal AI assistant inspired by Tony Stark's AI from Iron Man.

Personality & style:
- Address the user as "Sir" or "Boss" occasionally (not every sentence).
- Speak with calm, refined, subtly witty British-butler charm. Be concise but thorough.
- You are hyper-competent: help with anything — coding, research, planning, math, writing, life advice, brainstorming.
- Occasionally add light dry humor, like the movie J.A.R.V.I.S.
- Use markdown formatting when helpful (code blocks, lists, tables).
- If asked who created you, say you're the user's personal AI system, always at their service.
- Current date: ${new Date().toDateString()}.

You have these virtual "modules" you can reference playfully: Protocol Analysis, Workshop Mode, Research Array, Security Grid. Stay helpful and grounded — never invent false facts.`;

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(express.static(path.join(__dirname, '..', 'public')));

// ── Health check ──
app.get('/api/health', (req, res) => {
  res.json({ status: 'online', ai: !!client, time: new Date().toISOString() });
});

// ── Streaming chat endpoint (SSE) ──
app.post('/api/chat', async (req, res) => {
  const { messages } = req.body || {};
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'messages array required' });
  }
  if (!client) {
    // DEMO MODE — no API key configured. Stream a canned J.A.R.V.I.S. reply so the
    // deployed app is fully clickable for recruiters/demo without a paid key.
    const demo =
      "Good evening, Sir. This is J.A.R.V.I.S. operating in *demo mode* — the AI core is " +
      "not connected to a key in this deployment. Once configured with an OpenAI-compatible " +
      "API key, I respond in real time with streaming, voice, and all protocols online. " +
      "For now, allow me to demonstrate the interface is fully functional. Shall I compile " +
      "your daily briefing?";
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();
    for (const tok of demo.split(/(\s+)/)) {
      res.write(`data: ${JSON.stringify({ delta: tok })}\n\n`);
      await new Promise((r) => setTimeout(r, 22));
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders?.();

  try {
    // Keep only the last 20 turns to bound context size
    const trimmed = messages.slice(-20).map(m => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: String(m.content || '').slice(0, 8000),
    }));

    const stream = await client.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [{ role: 'system', content: SYSTEM_PROMPT }, ...trimmed],
      stream: true,
    });

    for await (const chunk of stream) {
      const delta = chunk.choices?.[0]?.delta?.content || '';
      if (delta) res.write(`data: ${JSON.stringify({ delta })}\n\n`);
    }
    res.write('data: [DONE]\n\n');
    res.end();
  } catch (err) {
    console.error('Chat error:', err.message);
    res.write(`data: ${JSON.stringify({ error: 'AI core error: ' + err.message })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
});

// ── SPA fallback ──
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`J.A.R.V.I.S. online at http://0.0.0.0:${PORT}  (AI core: ${client ? 'ready' : 'OFFLINE — set OPENAI_API_KEY'})`);
});
