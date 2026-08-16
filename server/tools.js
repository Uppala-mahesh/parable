/**
 * JARVIS Tools — real-world capabilities the AI can invoke.
 * All free, keyless public APIs.
 */
import * as store from './store.js';

const UA = { 'User-Agent': 'Mozilla/5.0 (JARVIS-Assistant)' };

async function jfetch(url, opts = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), 10000);
  try {
    const res = await fetch(url, { ...opts, headers: { ...UA, ...(opts.headers || {}) }, signal: ctrl.signal });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res;
  } finally {
    clearTimeout(t);
  }
}

/* ── Weather (Open-Meteo) ── */
const WMO = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Depositing rime fog', 51: 'Light drizzle', 53: 'Drizzle',
  55: 'Dense drizzle', 61: 'Light rain', 63: 'Rain', 65: 'Heavy rain',
  66: 'Freezing rain', 67: 'Heavy freezing rain', 71: 'Light snow', 73: 'Snow',
  75: 'Heavy snow', 77: 'Snow grains', 80: 'Light showers', 81: 'Showers',
  82: 'Violent showers', 85: 'Snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm w/ hail', 99: 'Severe thunderstorm w/ hail',
};

export async function getWeather({ city }) {
  city = city || store.getSettings().city || 'New York';
  const geoRes = await jfetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en`);
  const geo = await geoRes.json();
  const loc = geo.results?.[0];
  if (!loc) return { error: `Location "${city}" not found.` };

  const wRes = await jfetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}` +
    `&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m` +
    `&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max&forecast_days=4&timezone=auto`
  );
  const w = await wRes.json();
  const c = w.current;
  return {
    location: `${loc.name}${loc.country ? ', ' + loc.country : ''}`,
    current: {
      temp_c: c.temperature_2m,
      feels_like_c: c.apparent_temperature,
      humidity_pct: c.relative_humidity_2m,
      wind_kmh: c.wind_speed_10m,
      condition: WMO[c.weather_code] || 'Unknown',
    },
    forecast: (w.daily?.time || []).map((d, i) => ({
      date: d,
      condition: WMO[w.daily.weather_code[i]] || 'Unknown',
      max_c: w.daily.temperature_2m_max[i],
      min_c: w.daily.temperature_2m_min[i],
      rain_chance_pct: w.daily.precipitation_probability_max?.[i] ?? null,
    })),
  };
}

/* ── News (RSS: BBC + Hacker News tech) ── */
function parseRss(xml, limit = 6) {
  const items = [];
  const re = /<item>([\s\S]*?)<\/item>/g;
  let m;
  while ((m = re.exec(xml)) && items.length < limit) {
    const block = m[1];
    const pick = (tag) => {
      const r = block.match(new RegExp(`<${tag}>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?<\\/${tag}>`));
      return r ? r[1].replace(/<[^>]+>/g, '').trim() : '';
    };
    items.push({ title: pick('title'), description: pick('description').slice(0, 200), link: pick('link'), pubDate: pick('pubDate') });
  }
  return items;
}

export async function getNews({ topic } = {}) {
  topic = (topic || 'world').toLowerCase();
  const feeds = {
    world: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    business: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    technology: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    science: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    health: 'https://feeds.bbci.co.uk/news/health/rss.xml',
    sports: 'https://feeds.bbci.co.uk/sport/rss.xml',
  };
  const url = feeds[topic] || feeds.world;
  const res = await jfetch(url);
  const xml = await res.text();
  return { topic, headlines: parseRss(xml, 6) };
}

export async function getHackerNews() {
  const idsRes = await jfetch('https://hacker-news.firebaseio.com/v0/topstories.json');
  const ids = (await idsRes.json()).slice(0, 6);
  const stories = await Promise.all(ids.map(async (id) => {
    try {
      const r = await jfetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
      const s = await r.json();
      return { title: s.title, url: s.url || `https://news.ycombinator.com/item?id=${id}`, score: s.score, comments: s.descendants };
    } catch { return null; }
  }));
  return { stories: stories.filter(Boolean) };
}

/* ── Web search (DuckDuckGo HTML scrape + instant answers) ── */
export async function webSearch({ query }) {
  if (!query) return { error: 'query required' };
  const out = { query, instant_answer: null, results: [] };

  // Instant answer API
  try {
    const iaRes = await jfetch(`https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`);
    const ia = await iaRes.json();
    const answer = ia.AbstractText || ia.Answer || ia.Definition;
    if (answer) out.instant_answer = { text: String(answer).slice(0, 500), source: ia.AbstractSource || ia.AnswerType || '' };
  } catch { /* ignore */ }

  // HTML results
  try {
    const res = await jfetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`);
    const html = await res.text();
    const re = /<a[^>]+class="result__a"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>[\s\S]*?class="result__snippet"[^>]*>([\s\S]*?)<\/a>/g;
    let m;
    while ((m = re.exec(html)) && out.results.length < 5) {
      const clean = (s) => s.replace(/<[^>]+>/g, '').replace(/&amp;/g, '&').replace(/&#x27;/g, "'").replace(/&quot;/g, '"').trim();
      let href = m[1];
      const uddg = href.match(/uddg=([^&]+)/);
      if (uddg) href = decodeURIComponent(uddg[1]);
      out.results.push({ title: clean(m[2]), url: href, snippet: clean(m[3]).slice(0, 200) });
    }
  } catch { /* ignore */ }

  if (!out.instant_answer && out.results.length === 0) out.error = 'No results found.';
  return out;
}

/* ── Wikipedia summary ── */
export async function wikipedia({ topic }) {
  if (!topic) return { error: 'topic required' };
  try {
    const res = await jfetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(topic.replace(/ /g, '_'))}`);
    const d = await res.json();
    return { title: d.title, summary: d.extract, url: d.content_urls?.desktop?.page };
  } catch {
    return { error: `No Wikipedia article found for "${topic}".` };
  }
}

/* ── Crypto & currency ── */
export async function getCrypto({ coins } = {}) {
  const ids = (coins && coins.length ? coins : ['bitcoin', 'ethereum', 'solana']).join(',');
  const res = await jfetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(ids)}&vs_currencies=usd&include_24hr_change=true`);
  return await res.json();
}

export async function convertCurrency({ amount, from, to }) {
  const res = await jfetch(`https://api.frankfurter.app/latest?amount=${amount || 1}&from=${(from || 'USD').toUpperCase()}&to=${(to || 'EUR').toUpperCase()}`);
  return await res.json();
}

/* ── Fun ── */
export async function getJoke() {
  const res = await jfetch('https://official-joke-api.appspot.com/random_joke');
  const j = await res.json();
  return { setup: j.setup, punchline: j.punchline };
}

/* ── Task tools (persisted) ── */
export async function manageTasks({ action, text, id, priority }) {
  switch (action) {
    case 'list': return { tasks: store.listTasks() };
    case 'add': {
      if (!text) return { error: 'text required' };
      return { added: store.addTask(text, priority || 'normal') };
    }
    case 'complete': {
      if (id) { const t = store.updateTask(id, { done: true }); return t ? { completed: t } : { error: 'task not found' }; }
      if (text) { const t = store.completeTaskByText(text); return t ? { completed: t } : { error: 'no matching open task' }; }
      return { error: 'id or text required' };
    }
    case 'delete': {
      if (!id) return { error: 'id required' };
      return { deleted: store.deleteTask(id) };
    }
    default: return { error: `unknown action "${action}"` };
  }
}

/* ── Memory tools (persisted) ── */
export async function manageMemory({ action, text, query, id }) {
  switch (action) {
    case 'save': {
      if (!text) return { error: 'text required' };
      return { saved: store.addMemory(text) };
    }
    case 'recall': {
      const found = query ? store.searchMemories(query) : store.listMemories().slice(-10);
      return { memories: found };
    }
    case 'list': return { memories: store.listMemories() };
    case 'forget': {
      if (!id) return { error: 'id required' };
      return { forgotten: store.deleteMemory(id) };
    }
    default: return { error: `unknown action "${action}"` };
  }
}

/* ── Tool registry (OpenAI function-calling schema) ── */
export const TOOL_DEFS = [
  {
    type: 'function',
    function: {
      name: 'get_weather',
      description: 'Get current weather and 4-day forecast for a city. Use for any weather question or daily briefings.',
      parameters: {
        type: 'object',
        properties: { city: { type: 'string', description: "City name, e.g. 'London'. Omit to use the user's home city." } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_news',
      description: 'Get latest news headlines from BBC by topic.',
      parameters: {
        type: 'object',
        properties: { topic: { type: 'string', enum: ['world', 'business', 'technology', 'science', 'health', 'sports'] } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_hacker_news',
      description: 'Get top Hacker News tech/startup stories right now.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'web_search',
      description: 'Search the web (DuckDuckGo) for current information, facts, or anything you do not know.',
      parameters: {
        type: 'object',
        properties: { query: { type: 'string' } },
        required: ['query'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'wikipedia',
      description: 'Get a Wikipedia summary of a topic, person, place, or concept.',
      parameters: {
        type: 'object',
        properties: { topic: { type: 'string' } },
        required: ['topic'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_crypto',
      description: 'Get live cryptocurrency prices in USD with 24h change.',
      parameters: {
        type: 'object',
        properties: { coins: { type: 'array', items: { type: 'string' }, description: "CoinGecko ids, e.g. ['bitcoin','ethereum']" } },
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'convert_currency',
      description: 'Convert an amount between fiat currencies using live exchange rates.',
      parameters: {
        type: 'object',
        properties: {
          amount: { type: 'number' },
          from: { type: 'string', description: 'ISO code e.g. USD' },
          to: { type: 'string', description: 'ISO code e.g. EUR' },
        },
        required: ['amount', 'from', 'to'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_joke',
      description: 'Fetch a random joke when the user wants humor.',
      parameters: { type: 'object', properties: {} },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_tasks',
      description: "Manage the user's persistent task list: list, add, complete, or delete tasks. Use whenever the user mentions todos, reminders, or things to do.",
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['list', 'add', 'complete', 'delete'] },
          text: { type: 'string', description: 'Task text (for add) or search text (for complete)' },
          id: { type: 'string' },
          priority: { type: 'string', enum: ['low', 'normal', 'high'] },
        },
        required: ['action'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'manage_memory',
      description: "JARVIS's long-term memory about the user. Save important personal facts the user shares (preferences, birthdays, names, goals). Recall when context would help. Actions: save, recall, list, forget.",
      parameters: {
        type: 'object',
        properties: {
          action: { type: 'string', enum: ['save', 'recall', 'list', 'forget'] },
          text: { type: 'string' },
          query: { type: 'string' },
          id: { type: 'string' },
        },
        required: ['action'],
      },
    },
  },
];

export const TOOL_IMPLS = {
  get_weather: getWeather,
  get_news: getNews,
  get_hacker_news: getHackerNews,
  web_search: webSearch,
  wikipedia,
  get_crypto: getCrypto,
  convert_currency: convertCurrency,
  get_joke: getJoke,
  manage_tasks: manageTasks,
  manage_memory: manageMemory,
};
