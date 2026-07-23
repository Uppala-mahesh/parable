/* ══════════ J.A.R.V.I.S. Frontend ══════════ */
(() => {
  const $ = (id) => document.getElementById(id);
  const messagesEl = $('messages');
  const chatArea = $('chat-area');
  const inputEl = $('user-input');
  const sendBtn = $('send-btn');
  const micBtn = $('mic-btn');
  const voiceToggle = $('voice-toggle');

  const state = {
    history: [],          // {role, content}
    busy: false,
    voiceOn: true,
    listening: false,
  };

  /* ── Boot sequence ── */
  const bootLines = [
    'INITIALIZING J.A.R.V.I.S. ...',
    'LOADING NEURAL CORE ...',
    'CALIBRATING VOICE MATRIX ...',
    'ESTABLISHING SECURE UPLINK ...',
    'ALL SYSTEMS NOMINAL',
  ];
  (async function boot() {
    const bar = $('boot-bar'), txt = $('boot-text');
    for (let i = 0; i < bootLines.length; i++) {
      txt.textContent = bootLines[i];
      bar.style.width = `${((i + 1) / bootLines.length) * 100}%`;
      await sleep(430);
    }
    $('boot-screen').classList.add('fade');
    $('app').classList.remove('hidden');
    setTimeout(() => $('boot-screen').remove(), 900);
    greet();
    checkHealth();
  })();

  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  /* ── Clock + health ── */
  function tick() {
    $('stat-time').textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  tick(); setInterval(tick, 10000);

  async function checkHealth() {
    try {
      const r = await fetch('/api/health');
      const d = await r.json();
      const el = $('stat-ai');
      el.textContent = d.ai ? 'READY' : 'OFFLINE';
      el.classList.toggle('offline', !d.ai);
    } catch {
      $('stat-ai').textContent = 'ERROR';
      $('stat-ai').classList.add('offline');
    }
  }

  /* ── Greeting ── */
  function greet() {
    const h = new Date().getHours();
    const tod = h < 5 ? 'evening' : h < 12 ? 'morning' : h < 18 ? 'afternoon' : 'evening';
    const text = `Good ${tod}, Sir. **J.A.R.V.I.S.** at your service — all systems are online.\n\nI can assist with coding, research, planning, writing, or anything else you require. You may type below, use the quick protocols, or press the microphone to speak. How may I be of assistance?`;
    addMessage('assistant', text);
    state.history.push({ role: 'assistant', content: text });
  }

  /* ── Rendering ── */
  function renderMarkdown(text) {
    try {
      return DOMPurify.sanitize(marked.parse(text, { breaks: true }));
    } catch { return escapeHtml(text); }
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
    scrollDown();
    return bubble;
  }

  function addTyping() {
    const msg = document.createElement('div');
    msg.className = 'msg assistant';
    msg.innerHTML = `<div class="avatar">JVS</div><div class="bubble"><div class="typing"><span></span><span></span><span></span></div></div>`;
    messagesEl.appendChild(msg);
    scrollDown();
    return msg;
  }

  function scrollDown() { chatArea.scrollTop = chatArea.scrollHeight; }

  /* ── Send / stream ── */
  async function send(text) {
    text = (text || '').trim();
    if (!text || state.busy) return;
    state.busy = true;
    sendBtn.disabled = true;
    stopSpeaking();

    addMessage('user', text);
    state.history.push({ role: 'user', content: text });
    inputEl.value = '';
    autosize();

    const typingEl = addTyping();
    let bubble = null;
    let full = '';

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
          if (obj.delta) {
            if (!bubble) { typingEl.remove(); bubble = addMessage('assistant', ''); }
            full += obj.delta;
            bubble.innerHTML = renderMarkdown(full);
            scrollDown();
          }
        }
      }

      if (!bubble) {
        typingEl.remove();
        full = 'Apologies, Sir — I received an empty response. Perhaps try again.';
        addMessage('assistant', full);
      }
      state.history.push({ role: 'assistant', content: full });
      if (state.voiceOn) speak(full);
    } catch (err) {
      typingEl.remove();
      if (bubble) bubble.parentElement.remove();
      addMessage('assistant', `⚠️ **System alert:** ${escapeHtml(err.message)}\n\nMy AI core appears to be unreachable, Sir. Please verify the API key configuration and try again.`);
    } finally {
      state.busy = false;
      sendBtn.disabled = false;
      inputEl.focus();
    }
  }

  /* ── Text-to-speech ── */
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

  function speak(text) {
    if (!('speechSynthesis' in window)) return;
    stopSpeaking();
    // strip markdown/code for cleaner speech; cap length
    const clean = text
      .replace(/```[\s\S]*?```/g, ' Code block omitted. ')
      .replace(/[*_`#>|-]/g, ' ')
      .replace(/\[(.*?)\]\(.*?\)/g, '$1')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 600);
    if (!clean) return;
    const u = new SpeechSynthesisUtterance(clean);
    if (voice) u.voice = voice;
    u.rate = 1.02; u.pitch = 0.92;
    speechSynthesis.speak(u);
  }
  function stopSpeaking() {
    if ('speechSynthesis' in window) speechSynthesis.cancel();
  }

  voiceToggle.addEventListener('click', () => {
    state.voiceOn = !state.voiceOn;
    voiceToggle.textContent = state.voiceOn ? '🔊 VOICE ON' : '🔇 VOICE OFF';
    voiceToggle.classList.toggle('off', !state.voiceOn);
    if (!state.voiceOn) stopSpeaking();
  });

  /* ── Speech-to-text ── */
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  let recognition = null;
  if (SR) {
    recognition = new SR();
    recognition.lang = 'en-US';
    recognition.interimResults = true;
    recognition.onresult = (e) => {
      let transcript = '';
      for (const r of e.results) transcript += r[0].transcript;
      inputEl.value = transcript;
      autosize();
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
  }

  micBtn.addEventListener('click', () => {
    if (!recognition) return;
    if (state.listening) {
      recognition.stop();
      stopListening();
    } else {
      stopSpeaking();
      state.listening = true;
      micBtn.classList.add('listening');
      try { recognition.start(); } catch { stopListening(); }
    }
  });

  /* ── Input handlers ── */
  function autosize() {
    inputEl.style.height = 'auto';
    inputEl.style.height = Math.min(inputEl.scrollHeight, 140) + 'px';
  }
  inputEl.addEventListener('input', autosize);
  inputEl.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      send(inputEl.value);
    }
  });
  sendBtn.addEventListener('click', () => send(inputEl.value));

  document.querySelectorAll('.qc').forEach(btn => {
    btn.addEventListener('click', () => send(btn.dataset.q));
  });
})();
