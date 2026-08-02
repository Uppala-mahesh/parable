/* ══════════ J.A.R.V.I.S. Voice / Wake Word / Timers / Commands ══════════ */
(() => {
  const $ = (id) => document.getElementById(id);
  const core = window.__jarvisCore;
  const { state, send, addMessage, sfx, refreshPanel } = core;
  const inputEl = core.inputEl, micBtn = core.micBtn;

  /* ══ Text-to-speech ══ */
  let voice = null;
  function pickVoice() {
    const voices = speechSynthesis.getVoices();
    voice =
      voices.find(v => /en-GB/i.test(v.lang) && /male|daniel|arthur|george/i.test(v.name)) ||
      voices.find(v => /en-GB/i.test(v.lang)) ||
      voices.find(v => /^en/i.test(v.lang)) || null;
  }
  if ('speechSynthesis' in window) {
    pickVoice();
    speechSynthesis.onvoiceschanged = pickVoice;
  }

  window.__speak = function speak(text) {
    if (!('speechSynthesis' in window) || !state.voiceOn) return;
    window.__stopSpeaking();
    const clean = String(text)
      .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
      .replace(/[*_`#>|]/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    if (voice) u.voice = voice;
    u.rate = 1.02; u.pitch = 0.92;
    speechSynthesis.speak(u);
  };
  window.__stopSpeaking = function () {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  };

  /* ══ Speech recognition: manual mic + wake word ══ */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;   // manual dictation
  let wakeRec = null;       // continuous wake-word listener

  if (SR) {
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let transcript = '';
      for (const r of e.results) transcript += r[0].transcript;
      inputEl.value = transcript;
      core.autosize();
      if (e.results[e.results.length - 1].isFinal) {
        stopListening();
        send(transcript);
      }
    };
    recognition.onend = stopListening;
    recognition.onerror = stopListening;
  } else {
    micBtn.title = 'Voice input not supported in this browser';
    micBtn.disabled = true;
  }

  function stopListening() {
    state.listening = false;
    micBtn.classList.remove('listening');
    if (state.wakeOn) startWake(); // resume wake listening
  }

  function startDictation() {
    if (!recognition || state.listening) return;
    window.__stopSpeaking();
    stopWake();
    state.listening = true;
    micBtn.classList.add('listening');
    sfx.listen();
    try { recognition.start(); } catch { stopListening(); }
  }

  micBtn.addEventListener('click', () => {
    if (state.listening) { recognition?.stop(); stopListening(); }
    else startDictation();
  });

  /* wake word */
  function startWake() {
    if (!SR || !state.wakeOn || state.listening) return;
    if (wakeRec) return;
    wakeRec = new SR();
    wakeRec.lang = 'en-US';
    wakeRec.continuous = true;
    wakeRec.interimResults = true;
    wakeRec.onresult = (e) => {
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript.toLowerCase();
        if (/\b(jarvis|hey jarvis)\b/.test(t)) {
          sfx.listen();
          stopWake();
          window.__speak('Yes?');
          setTimeout(startDictation, 700);
          return;
        }
      }
    };
    wakeRec.onend = () => { wakeRec = null; if (state.wakeOn && !state.listening) setTimeout(startWake, 400); };
    wakeRec.onerror = () => { /* onend will fire */ };
    try { wakeRec.start(); } catch { wakeRec = null; }
  }
  function stopWake() {
    if (wakeRec) { try { wakeRec.onend = null; wakeRec.stop(); } catch { } wakeRec = null; }
  }

  /* ══ Timers ══ */
  const strip = $('timer-strip');
  function fmt(ms) {
    const s = Math.max(0, Math.ceil(ms / 1000));
    const m = Math.floor(s / 60), r = s % 60;
    const h = Math.floor(m / 60);
    return h ? `${h}:${String(m % 60).padStart(2, '0')}:${String(r).padStart(2, '0')}` : `${m}:${String(r).padStart(2, '0')}`;
  }
  function addTimer(ms, label) {
    const t = { id: Math.random().toString(36).slice(2), end: Date.now() + ms, label: label || 'TIMER', fired: false };
    state.timers.push(t);
    renderTimers();
    return t;
  }
  function renderTimers() {
    strip.innerHTML = state.timers.map(t => {
      const left = t.end - Date.now();
      return `<span class="timer-chip ${left <= 0 ? 'expired' : ''}" data-id="${t.id}">
        ⏱ ${core.escapeHtml(t.label)} · ${left <= 0 ? 'DONE' : fmt(left)}
        <button class="timer-x" data-id="${t.id}">✕</button></span>`;
    }).join('');
  }
  setInterval(() => {
    let changed = false;
    for (const t of state.timers) {
      if (!t.fired && Date.now() >= t.end) {
        t.fired = true; changed = true;
        sfx.alarm();
        window.__speak(`${state.settings.userName}, your ${t.label} is complete.`);
        addMessage('assistant', `⏱ **Timer complete:** ${core.escapeHtml(t.label)}`);
      }
    }
    if (state.timers.length) renderTimers();
    if (changed) renderTimers();
  }, 1000);
  strip.addEventListener('click', (e) => {
    const id = e.target.closest('.timer-x')?.dataset.id;
    if (id) { state.timers = state.timers.filter(t => t.id !== id); renderTimers(); }
  });

  function parseTimer(text) {
    // "set a timer for 5 minutes", "timer 30 sec", "remind me in 1 hour to stretch"
    const m = text.match(/(?:timer|remind me|countdown|alarm)[^0-9]*?(\d+(?:\.\d+)?)\s*(hours?|hrs?|h|minutes?|mins?|m|seconds?|secs?|s)\b(?:\s*(?:to|for)?\s*(.*))?/i);
    if (!m) return null;
    const n = parseFloat(m[1]);
    const unit = m[2][0].toLowerCase();
    const ms = n * (unit === 'h' ? 3600000 : unit === 'm' ? 60000 : 1000);
    const label = (m[3] || '').trim() || `${m[1]} ${m[2]}`;
    return { ms, label };
  }

  /* ══ Local commands (slash + intents) ══ */
  const HELP = `**J.A.R.V.I.S. Command Protocols**

| Command | Effect |
|---|---|
| \`/help\` | This list |
| \`/clear\` | Wipe conversation display |
| \`/timer 5m [label]\` | Quick timer (also natural: "set a timer for 5 minutes") |
| \`/settings\` | Open system configuration |
| 👂 WAKE | Say **"Jarvis"** aloud to activate the mic |
| 🎙 Mic | Push-to-talk dictation |
| 🔊 VOICE | Toggle spoken replies |
| 📡 HUD | Toggle side panels |

**I also handle naturally:** weather, news, web searches, Wikipedia, crypto prices, currency conversion, jokes, adding/completing tasks, remembering facts about you, daily briefings — just ask.`;

  window.__handleLocal = function (text) {
    const t = text.trim();

    if (/^\/help$/i.test(t)) { addMessage('user', t); addMessage('assistant', HELP); return true; }

    if (/^\/clear$/i.test(t)) {
      document.getElementById('messages').innerHTML = '';
      state.history = [];
      addMessage('assistant', 'Display buffer purged. Conversation memory reset. What next?');
      return true;
    }

    if (/^\/settings$/i.test(t)) { openSettings(); return true; }

    const slashTimer = t.match(/^\/timer\s+(\d+(?:\.\d+)?)\s*(h|m|s|hours?|mins?|minutes?|secs?|seconds?)?\s*(.*)$/i);
    if (slashTimer) {
      const n = parseFloat(slashTimer[1]);
      const u = (slashTimer[2] || 'm')[0].toLowerCase();
      const ms = n * (u === 'h' ? 3600000 : u === 'm' ? 60000 : 1000);
      const label = slashTimer[3] || `${n}${u}`;
      addTimer(ms, label);
      addMessage('user', t);
      addMessage('assistant', `⏱ Timer set: **${core.escapeHtml(label)}** — ${fmt(ms)}. I'll notify you, ${state.settings.userName}.`);
      sfx.tool();
      return true;
    }

    // natural-language timer
    if (/\b(set|start)\b.*\b(timer|alarm|countdown)\b|\bremind me in\b/i.test(t)) {
      const p = parseTimer(t);
      if (p) {
        addTimer(p.ms, p.label);
        addMessage('user', t);
        addMessage('assistant', `⏱ Very well — timer **${core.escapeHtml(p.label)}** running for ${fmt(p.ms)}. I shall alert you the moment it completes.`);
        window.__speak(`Timer set for ${p.label}.`);
        sfx.tool();
        return true;
      }
    }
    return false;
  };

  /* ══ Toggles ══ */
  window.__syncToggleUI = function () {
    $('voice-toggle').textContent = state.voiceOn ? '🔊 VOICE' : '🔇 MUTED';
    $('voice-toggle').classList.toggle('off', !state.voiceOn);
    $('diag-voice').textContent = state.voiceOn ? 'ON' : 'OFF';
    $('wake-toggle').classList.toggle('active', state.wakeOn);
    $('diag-wake').textContent = state.wakeOn ? 'ON' : 'OFF';
  };

  $('voice-toggle').addEventListener('click', () => {
    state.voiceOn = !state.voiceOn;
    localStorage.setItem('jarvis_voice', JSON.stringify(state.voiceOn));
    if (!state.voiceOn) window.__stopSpeaking();
    window.__syncToggleUI();
  });

  $('wake-toggle').addEventListener('click', () => {
    if (!SR) { addMessage('assistant', 'I\'m afraid wake-word detection isn\'t supported in this browser. Chrome or Edge would serve us better.'); return; }
    state.wakeOn = !state.wakeOn;
    if (state.wakeOn) { startWake(); window.__speak('Wake word armed. Say Jarvis when you need me.'); }
    else stopWake();
    window.__syncToggleUI();
  });

  $('panel-toggle').addEventListener('click', () => {
    const p = $('hud-panels');
    if (innerWidth <= 1020) p.classList.toggle('force-show');
    else p.classList.toggle('collapsed');
  });

  /* reactor easter egg */
  $('reactor-btn').addEventListener('click', () => {
    sfx.boot();
    window.__speak('At your service.');
  });

  /* ══ Settings modal ══ */
  function openSettings() {
    $('set-name').value = state.settings.userName || '';
    $('set-city').value = state.settings.city || '';
    $('set-sound').checked = state.soundOn;
    $('settings-modal').classList.remove('hidden');
  }
  $('settings-btn').addEventListener('click', openSettings);
  $('settings-cancel').addEventListener('click', () => $('settings-modal').classList.add('hidden'));
  $('settings-modal').addEventListener('click', (e) => {
    if (e.target === $('settings-modal')) $('settings-modal').classList.add('hidden');
  });
  $('settings-save').addEventListener('click', async () => {
    const userName = $('set-name').value.trim() || 'Sir';
    const city = $('set-city').value.trim() || 'New York';
    state.soundOn = $('set-sound').checked;
    localStorage.setItem('jarvis_sound', JSON.stringify(state.soundOn));
    try {
      state.settings = await (await fetch('/api/settings', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userName, city }),
      })).json();
    } catch { /* ignore */ }
    $('settings-modal').classList.add('hidden');
    refreshPanel('weather');
    addMessage('assistant', `Configuration updated. I shall address you as **${core.escapeHtml(state.settings.userName)}**, home city set to **${core.escapeHtml(state.settings.city)}**.`);
    sfx.tool();
  });
})();
