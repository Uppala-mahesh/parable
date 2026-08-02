/* ══════════ J.A.R.V.I.S. Frontend v2 ══════════
 * Chat + tools, HUD panels, wake word, timers, sounds, slash commands.
 */
(() => {
  const $ = (id) => document.getElementById(id);
  const messagesEl = $('messages');
  const chatArea = $('chat-area');
  const inputEl = $('user-input');
  const sendBtn = $('send-btn');
  const micBtn = $('mic-btn');

  const state = {
    history: [],
    busy: false,
    voiceOn: JSON.parse(localStorage.getItem('jarvis_voice') ?? 'true'),
    soundOn: JSON.parse(localStorage.getItem('jarvis_sound') ?? 'true'),
    wakeOn: false,
    listening: false,
    msgCount: 0,
    settings: { userName: 'Sir', city: 'New York' },
    timers: [],
  };

  const sleep = (ms) => new Promise(r => setTimeout(r, ms));

  /* ══ Sound effects (WebAudio, no assets) ══ */
  let audioCtx = null;
  function beep(freq = 880, dur = 0.08, type = 'sine', vol = 0.06, when = 0) {
    if (!state.soundOn) return;
    try {
      audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
      const t = audioCtx.currentTime + when;
      const o = audioCtx.createOscillator();
      const g = audioCtx.createGain();
      o.type = type; o.frequency.value = freq;
      g.gain.setValueAtTime(vol, t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g).connect(audioCtx.destination);
      o.start(t); o.stop(t + dur + 0.02);
    } catch { /* ignore */ }
  }
  const sfx = {
    boot: () => { beep(440, .1); beep(660, .1, 'sine', .06, .12); beep(880, .18, 'sine', .06, .24); },
    send: () => beep(980, .05, 'triangle', .05),
    recv: () => beep(620, .07, 'sine', .05),
    tool: () => beep(1250, .04, 'square', .03),
    alarm: () => { for (let i = 0; i < 4; i++) { beep(880, .12, 'square', .08, i * .25); beep(660, .12, 'square', .08, i * .25 + .12); } },
    listen: () => beep(1320, .07, 'sine', .06),
    error: () => beep(220, .25, 'sawtooth', .05),
  };

  /* ══ Particle background ══ */
  (function particles() {
    const cv = $('bg-particles'), ctx = cv.getContext('2d');
    let pts = [];
    function resize() {
      cv.width = innerWidth; cv.height = innerHeight;
      const n = Math.min(70, Math.floor(innerWidth / 22));
      pts = Array.from({ length: n }, () => ({
        x: Math.random() * cv.width, y: Math.random() * cv.height,
        vx: (Math.random() - .5) * .3, vy: (Math.random() - .5) * .3,
        r: Math.random() * 1.6 + .4,
      }));
    }
    resize(); addEventListener('resize', resize);
    (function frame() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      for (const p of pts) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > cv.width) p.vx *= -1;
        if (p.y < 0 || p.y > cv.height) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, 7);
        ctx.fillStyle = 'rgba(25,230,255,0.35)';
        ctx.fill();
      }
      // connect close particles
      for (let i = 0; i < pts.length; i++) for (let j = i + 1; j < pts.length; j++) {
        const dx = pts[i].x - pts[j].x, dy = pts[i].y - pts[j].y, d = dx * dx + dy * dy;
        if (d < 130 * 130) {
          ctx.strokeStyle = `rgba(25,230,255,${0.10 * (1 - d / (130 * 130))})`;
          ctx.beginPath(); ctx.moveTo(pts[i].x, pts[i].y); ctx.lineTo(pts[j].x, pts[j].y); ctx.stroke();
        }
      }
      requestAnimationFrame(frame);
    })();
  })();

  /* ══ Boot sequence ══ */
  const bootLines = [
    'INITIALIZING J.A.R.V.I.S. ...',
    'LOADING NEURAL CORE ...',
    'MOUNTING TOOL MODULES: WEATHER · NEWS · SEARCH · MEMORY ...',
    'CALIBRATING VOICE MATRIX ...',
    'SYNCING MISSION OBJECTIVES ...',
    'ALL SYSTEMS NOMINAL',
  ];
  (async function boot() {
    const bar = $('boot-bar'), txt = $('boot-text');
    for (let i = 0; i < bootLines.length; i++) {
      txt.textContent = bootLines[i];
      bar.style.width = `${((i + 1) / bootLines.length) * 100}%`;
      await sleep(380);
    }
    $('boot-screen').classList.add('fade');
    $('app').classList.remove('hidden');
    setTimeout(() => $('boot-screen')?.remove(), 900);
    sfx.boot();
    await loadSettings();
    greet();
    checkHealth();
    refreshPanel('weather'); refreshPanel('tasks'); refreshPanel('news'); refreshPanel('memory');
    syncToggleUI();
  })();

  /* ══ Clock + health ══ */
  function tick() {
    $('stat-time').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  tick(); setInterval(tick, 10000);

  async function checkHealth() {
    try {
      const d = await (await fetch('/api/health')).json();
      const el = $('stat-ai');
      el.textContent = d.ai ? 'READY' : 'OFFLINE';
      el.classList.toggle('offline', !d.ai);
      $('diag-ai').textContent = d.ai ? 'ONLINE' : 'OFFLINE';
      $('diag-model').textContent = (d.model || '—').toUpperCase();
      const up = d.uptime_s || 0;
      $('diag-uptime').textContent = up > 3600 ? `${(up / 3600).toFixed(1)}H` : up > 60 ? `${Math.floor(up / 60)}M` : `${up}S`;
    } catch {
      $('stat-ai').textContent = 'ERROR';
      $('stat-ai').classList.add('offline');
    }
  }
  setInterval(checkHealth, 60000);

  async function loadSettings() {
    try { state.settings = await (await fetch('/api/settings')).json(); } catch { /* ignore */ }
  }

  /* ══ Greeting ══ */
  function greet() {
    const h = new Date().getHours();
    const tod = h < 5 ? 'evening' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    const text = `Good ${tod}, ${state.settings.userName}. **J.A.R.V.I.S.** fully operational — all modules online.\n\nI now command real systems: live **weather**, **news**, **web search**, **Wikipedia**, **markets**, a persistent **task list** and **long-term memory**. I can also run **timers** ("set a timer for 5 minutes"), and you may enable the **wake word** (👂) to summon me by saying *"Jarvis"*.\n\nType \`/help\` for command protocols, or simply tell me what you need.`;
    addMessage('assistant', text);
    state.history.push({ role: 'assistant', content: text });
  }

  /* ══ Rendering ══ */
  function renderMarkdown(text) {
    try { return DOMPurify.sanitize(marked.parse(text, { breaks: true })); }
    catch { return escapeHtml(text); }
  }
  function escapeHtml(s) {
    const d = document.createElement('div'); d.textContent = s; return d.innerHTML;
  }

  function addMessage(role, content) {
    const msg = document.createElement('div');
    msg.className = `msg ${role}`;
    const av = document.createElement('div');
    av.className = 'avatar';
    av.textContent = role === 'assistant' ? 'JVS' : 'YOU';
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    bubble.innerHTML = role === 'assistant' ? renderMarkdown(content) : escapeHtml(content);
    msg.append(av, bubble);
    messagesEl.appendChild(msg);
    state.msgCount++;
    $('diag-msgs').textContent = state.msgCount;
    scrollDown();
    return bubble;
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg assistant';
    msg.innerHTML = `<div class="avatar">JVS</div><div class="bubble"><div class="tool-zone"></div><div class="typing"><span></span><span></span><span></span></div></div>`;
    messagesEl.appendChild(msg);
    scrollDown();
    return msg;
  }

  function scrollDown() { chatArea.scrollTop = chatArea.scrollHeight; }

  const TOOL_LABELS = {
    get_weather: 'ATMOSPHERICS', get_news: 'NEWS UPLINK', get_hacker_news: 'TECH FEED',
    web_search: 'WEB SEARCH', wikipedia: 'ARCHIVES', get_crypto: 'MARKETS',
    convert_currency: 'EXCHANGE', get_joke: 'HUMOR PROTOCOL',
    manage_tasks: 'OBJECTIVES', manage_memory: 'MEMORY BANKS',
    rate_limit: 'THROTTLED — RETRYING',
  };

  /* ══ Send / stream (with tool events) ══ */
  async function send(text) {
    text = (text || '').trim();
    if (!text || state.busy) return;

    // Slash commands & local intents handled client-side
    if (handleLocal(text)) { inputEl.value = ''; autosize(); return; }

    state.busy = true;
    sendBtn.disabled = true;
    stopSpeaking();
    sfx.send();

    addMessage('user', text);
    state.history.push({ role: 'user', content: text });
    inputEl.value = '';
    autosize();

    const typingEl = addTyping();
    const toolZone = typingEl.querySelector('.tool-zone');
    const chips = {};
    let bubble = null;
    let full = '';
    let usedTools = false;

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: state.history }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `Server error ${res.status}`);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith('data: ')) continue;
          const payload = line.slice(6);
          if (payload === '[DONE]') continue;
          let obj;
          try { obj = JSON.parse(payload); } catch { continue; }
          if (obj.error) throw new Error(obj.error);

          if (obj.tool) {
            usedTools = true;
            sfx.tool();
            const key = obj.tool;
            if (!chips[key]) {
              const chip = document.createElement('span');
              chip.className = 'tool-chip';
              chip.innerHTML = `<span class="dot"></span>${TOOL_LABELS[key] || key.toUpperCase()}`;
              toolZone.appendChild(chip);
              chips[key] = chip;
            }
            if (obj.status === 'done') chips[key].classList.add('done');
            scrollDown();
          }

          if (obj.delta) {
            if (!bubble) {
              // convert typing bubble into the answer bubble, keep tool chips above
              const b = typingEl.querySelector('.bubble');
              b.querySelector('.typing')?.remove();
              bubble = document.createElement('div');
              b.appendChild(bubble);
            }
            full += obj.delta;
            bubble.innerHTML = renderMarkdown(full);
            scrollDown();
          }
        }
      }

      if (!full) {
        typingEl.remove();
        full = 'Apologies — I received an empty response. Perhaps try again.';
        addMessage('assistant', full);
      }
      state.history.push({ role: 'assistant', content: full });
      sfx.recv();
      if (state.voiceOn) speak(full);
      if (usedTools) { refreshPanel('tasks'); refreshPanel('memory'); }
    } catch (err) {
      typingEl.remove();
      sfx.error();
      addMessage('assistant', `⚠️ **System alert:** ${escapeHtml(err.message)}\n\nMy AI core appears unreachable, ${state.settings.userName}. Verify the API key configuration and try again.`);
    } finally {
      state.busy = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  /* placeholder — extended in part 2 */
  window.__jarvis = { state, send, addMessage, sfx, refreshPanel, speak, stopSpeaking, escapeHtml, syncToggleUI };

  /* ══ Panels ══ */
  async function refreshPanel(name) {
    try {
      if (name === 'weather') return renderWeather(await (await fetch('/api/panel/weather')).json());
      if (name === 'news') return renderNews(await (await fetch('/api/panel/news?topic=world')).json());
      if (name === 'tasks') return renderTasks(await (await fetch('/api/tasks')).json());
      if (name === 'memory') return renderMemory(await (await fetch('/api/memories')).json());
    } catch {
      const body = $(name + '-body');
      if (body) body.innerHTML = '<div class="panel-loading">SIGNAL LOST</div>';
    }
  }

  function renderWeather(d) {
    const el = $('weather-body');
    if (!d || d.error) { el.innerHTML = `<div class="mem-empty">${escapeHtml(d?.error || 'Unavailable')}</div>`; return; }
    const c = d.current;
    const days = (d.forecast || []).slice(1, 4).map(f => {
      const day = new Date(f.date + 'T00:00').toLocaleDateString([], { weekday: 'short' });
      return `<div class="wx-day"><b>${day}</b>${Math.round(f.max_c)}°<span> / ${Math.round(f.min_c)}°</span></div>`;
    }).join('');
    el.innerHTML = `
      <div class="wx-now"><span class="wx-temp">${Math.round(c.temp_c)}°C</span><span class="wx-cond">${escapeHtml(c.condition)}</span></div>
      <div class="wx-loc">${escapeHtml(d.location).toUpperCase()}</div>
      <div class="wx-meta"><span>FEELS ${Math.round(c.feels_like_c)}°</span><span>HUM ${c.humidity_pct}%</span><span>WIND ${Math.round(c.wind_kmh)} KM/H</span></div>
      <div class="wx-days">${days}</div>`;
  }

  function renderNews(d) {
    const el = $('news-body');
    if (!d?.headlines?.length) { el.innerHTML = '<div class="mem-empty">No feed data.</div>'; return; }
    el.innerHTML = d.headlines.slice(0, 5).map(h => `
      <div class="news-item">
        <a href="${encodeURI(h.link || '#')}" target="_blank" rel="noopener">${escapeHtml(h.title)}</a>
        <span class="news-src">BBC · ${h.pubDate ? new Date(h.pubDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}</span>
      </div>`).join('');
  }

  function renderTasks(d) {
    const el = $('tasks-body');
    const tasks = d?.tasks || [];
    if (!tasks.length) { el.innerHTML = '<div class="mem-empty">No objectives. Add one below or just tell me.</div>'; return; }
    el.innerHTML = tasks.slice(-12).reverse().map(t => `
      <div class="task-item ${t.done ? 'done' : ''}" data-id="${t.id}">
        <button class="task-check" data-act="toggle">${t.done ? '✓' : ''}</button>
        <span class="task-text">${escapeHtml(t.text)}</span>
        ${t.priority === 'high' ? '<span class="task-pri-high">▲HIGH</span>' : ''}
        <button class="task-del" data-act="del">✕</button>
      </div>`).join('');
  }

  function renderMemory(d) {
    const el = $('memory-body');
    const mems = d?.memories || [];
    if (!mems.length) { el.innerHTML = '<div class="mem-empty">Empty. Tell me things worth remembering — I\'ll store them.</div>'; return; }
    el.innerHTML = mems.slice(-8).reverse().map(m => `
      <div class="mem-item" data-id="${m.id}">
        <span>🧠</span><span class="mem-text">${escapeHtml(m.text)}</span>
        <button class="task-del" data-act="forget">✕</button>
      </div>`).join('');
  }

  /* panel interactions */
  document.querySelectorAll('.panel-refresh').forEach(b =>
    b.addEventListener('click', () => refreshPanel(b.dataset.panel)));

  $('tasks-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = e.target.closest('.task-item')?.dataset.id; if (!id) return;
    if (btn.dataset.act === 'toggle') {
      const isDone = e.target.closest('.task-item').classList.contains('done');
      await fetch(`/api/tasks/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ done: !isDone }) });
    } else if (btn.dataset.act === 'del') {
      await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    }
    refreshPanel('tasks');
  });

  $('memory-body').addEventListener('click', async (e) => {
    const btn = e.target.closest('button'); if (!btn) return;
    const id = e.target.closest('.mem-item')?.dataset.id; if (!id) return;
    await fetch(`/api/memories/${id}`, { method: 'DELETE' });
    refreshPanel('memory');
  });

  $('task-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const v = $('task-input').value.trim(); if (!v) return;
    await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ text: v }) });
    $('task-input').value = '';
    refreshPanel('tasks');
    sfx.tool();
  });

  /* ══ Voice, wake word, timers, local commands — part 2 ══ */
  function handleLocal(text) { return window.__handleLocal ? window.__handleLocal(text) : false; }
  function speak(t) { window.__speak?.(t); }
  function stopSpeaking() { window.__stopSpeaking?.(); }
  function syncToggleUI() { window.__syncToggleUI?.(); }

  /* input handlers */
  function autosize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  }
  inputEl.addEventListener('input', autosize);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(inputEl.value); }
  });
  sendBtn.addEventListener('click', () => send(inputEl.value));
  document.querySelectorAll('.qc').forEach(btn =>
    btn.addEventListener('click', () => send(btn.dataset.q)));

  window.__jarvisCore = { state, send, addMessage, sfx, refreshPanel, escapeHtml, autosize, micBtn, inputEl };
})();
