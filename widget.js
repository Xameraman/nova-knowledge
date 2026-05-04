(function () {
  const API_URL = 'https://xameraman5022-mia-assistant.hf.space/chat';
  const scriptTag = document.currentScript;
  const SOURCE = (scriptTag && scriptTag.getAttribute('data-source')) || 'general';

  let history = [];
  let isOpen = false;
  let isLoading = false;

  // ── CSS (same as before, but avatar now holds an <img>) ──
  const style = document.createElement('style');
  style.textContent = `
    #mia-widget-btn {
      position:fixed; bottom:24px; right:24px; z-index:99999;
      width:58px; height:58px; border-radius:50%;
      background:linear-gradient(135deg,#9B4FDB,#5865F2);
      border:none; cursor:pointer;
      box-shadow:0 4px 20px rgba(155,79,219,0.5);
      display:flex; align-items:center; justify-content:center;
      font-size:26px; transition:transform .2s, box-shadow .2s;
      animation: mia-pulse-ring 2.5s ease-in-out infinite;
    }
    @keyframes mia-pulse-ring {
      0%,100% { box-shadow:0 4px 20px rgba(155,79,219,0.5); }
      50%      { box-shadow:0 4px 32px rgba(155,79,219,0.9),0 0 0 8px rgba(155,79,219,0.15); }
    }
    #mia-widget-btn:hover { transform:scale(1.1); }
    #mia-widget-panel {
      position:fixed; bottom:94px; right:24px; z-index:99998;
      width:340px; max-width:calc(100vw - 48px);
      background:rgba(12,18,32,0.97);
      border:1.5px solid rgba(155,79,219,0.4);
      border-radius:16px;
      box-shadow:0 16px 48px rgba(0,0,0,0.6), 0 0 30px rgba(155,79,219,0.15);
      display:flex; flex-direction:column;
      transform:scale(0.9) translateY(16px);
      opacity:0; pointer-events:none;
      transition:all 0.25s cubic-bezier(.4,0,.2,1);
      overflow:hidden; max-height:520px;
    }
    #mia-widget-panel.mia-open {
      transform:scale(1) translateY(0);
      opacity:1; pointer-events:all;
    }
    #mia-panel-header {
      background:linear-gradient(135deg,rgba(155,79,219,0.25),rgba(88,101,242,0.2));
      padding:14px 16px; display:flex; align-items:center; gap:10px;
      border-bottom:1px solid rgba(255,255,255,0.07); flex-shrink:0;
    }
    #mia-avatar {
      width:36px; height:36px; border-radius:50%; overflow:hidden;
      flex-shrink:0; box-shadow:0 0 12px rgba(155,79,219,0.5);
    }
    #mia-avatar img {
      width:100%; height:100%; object-fit:cover;
    }
    #mia-panel-title { font-weight:900; font-size:14px; color:#fff; line-height:1.2; }
    #mia-panel-sub { font-size:11px; color:rgba(255,255,255,0.45); margin-top:2px; }
    #mia-online-dot {
      width:8px; height:8px; border-radius:50%;
      background:#47C96B; margin-left:auto; flex-shrink:0;
      box-shadow:0 0 6px #47C96B;
      animation: mia-blink 2s ease-in-out infinite;
    }
    @keyframes mia-blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
    #mia-messages {
      flex:1; overflow-y:auto; padding:14px 14px 8px;
      display:flex; flex-direction:column; gap:10px;
      font-family:'Nunito',sans-serif;
      scrollbar-width:thin; scrollbar-color:rgba(155,79,219,0.3) transparent;
    }
    #mia-messages::-webkit-scrollbar{width:4px;}
    #mia-messages::-webkit-scrollbar-track{background:transparent;}
    #mia-messages::-webkit-scrollbar-thumb{background:rgba(155,79,219,0.3);border-radius:2px;}
    .mia-msg {
      max-width:85%; padding:10px 13px; border-radius:12px;
      font-size:13.5px; line-height:1.65; animation:mia-pop .2s ease;
      word-break:break-word;
    }
    @keyframes mia-pop{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}
    .mia-msg.user {
      align-self:flex-end;
      background:linear-gradient(135deg,#9B4FDB,#5865F2);
      color:#fff; border-bottom-right-radius:4px;
    }
    .mia-msg.bot {
      align-self:flex-start;
      background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.08);
      color:#E0EAF0; border-bottom-left-radius:4px;
    }
    .mia-msg.bot strong{color:#FFD700;}
    .mia-msg.bot em{color:#47C96B;font-style:normal;}
    .mia-msg.bot code{background:rgba(0,0,0,0.4);padding:1px 5px;border-radius:3px;font-size:12px;color:#FFD700;}
    .mia-typing {
      align-self:flex-start;
      background:rgba(255,255,255,0.06);
      border:1px solid rgba(255,255,255,0.08);
      border-radius:12px; border-bottom-left-radius:4px;
      padding:10px 14px; display:flex; gap:5px; align-items:center;
    }
    .mia-dot {
      width:7px; height:7px; border-radius:50%;
      background:rgba(155,79,219,0.8);
      animation:mia-bounce .9s ease-in-out infinite;
    }
    .mia-dot:nth-child(2){animation-delay:.15s;}
    .mia-dot:nth-child(3){animation-delay:.3s;}
    @keyframes mia-bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-6px)}}
    #mia-input-row {
      display:flex; gap:8px; padding:10px 12px;
      border-top:1px solid rgba(255,255,255,0.07);
      background:rgba(0,0,0,0.2); flex-shrink:0;
    }
    #mia-input {
      flex:1; background:rgba(255,255,255,0.06);
      border:1.5px solid rgba(255,255,255,0.1);
      border-radius:10px; padding:9px 13px;
      color:#fff; font-size:13px; font-family:'Nunito',sans-serif;
      outline:none; resize:none; max-height:80px; overflow-y:auto;
      transition:border-color .2s;
    }
    #mia-input:focus{border-color:rgba(155,79,219,0.6);}
    #mia-input::placeholder{color:rgba(255,255,255,0.3);}
    #mia-input:disabled{opacity:0.5;cursor:not-allowed;}
    #mia-send {
      width:38px; height:38px; border-radius:10px;
      background:linear-gradient(135deg,#9B4FDB,#5865F2);
      border:none; cursor:pointer; color:#fff; font-size:17px;
      display:flex; align-items:center; justify-content:center;
      transition:transform .15s,opacity .15s; flex-shrink:0;
      align-self:flex-end;
    }
    #mia-send:hover:not(:disabled){transform:scale(1.08);}
    #mia-send:disabled{opacity:0.4;cursor:not-allowed;}
    #mia-footer-note {
      text-align:center; font-size:10px;
      color:rgba(255,255,255,0.2); padding:4px 0 8px;
      font-family:'Nunito',sans-serif; flex-shrink:0;
    }
  `;
  document.head.appendChild(style);

  // ── HTML (avatar now uses mia-logo.jpg, button uses 🤖) ──
  document.body.insertAdjacentHTML('beforeend', `
    <button id="mia-widget-btn" title="Chat with MIA Assistant">🤖</button>
    <div id="mia-widget-panel">
      <div id="mia-panel-header">
        <div id="mia-avatar">
          <img src="mia-logo.jpg" alt="MIA">
        </div>
        <div>
          <div id="mia-panel-title">MIA Assistant</div>
          <div id="mia-panel-sub">Minecraft Items Accelerated</div>
        </div>
        <div id="mia-online-dot"></div>
      </div>
      <div id="mia-messages">
        <div class="mia-msg bot">Hey! 👋 I'm <strong>MIA Assistant</strong>. Ask me anything about <em>MIA</em>, Minecraft Bedrock, or anything else — I'm here to help!</div>
      </div>
      <div id="mia-input-row">
        <textarea id="mia-input" placeholder="Ask me anything..." rows="1"></textarea>
        <button id="mia-send">➤</button>
      </div>
      <div id="mia-footer-note">MIA Assistance</div>
    </div>
  `);

  // ── JavaScript (logic unchanged except toggle icon) ──
  const btn     = document.getElementById('mia-widget-btn');
  const panel   = document.getElementById('mia-widget-panel');
  const msgs    = document.getElementById('mia-messages');
  const input   = document.getElementById('mia-input');
  const sendBtn = document.getElementById('mia-send');

  btn.addEventListener('click', () => {
    isOpen = !isOpen;
    panel.classList.toggle('mia-open', isOpen);
    btn.textContent = isOpen ? '✕' : '🤖';
    if (isOpen) { input.focus(); scrollToBottom(); }
  });

  input.addEventListener('input', () => {
    input.style.height = 'auto';
    input.style.height = Math.min(input.scrollHeight, 80) + 'px';
  });

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  });
  sendBtn.addEventListener('click', sendMessage);

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || isLoading) return;

    addMessage('user', text);
    history.push({ role: 'user', content: text });
    input.value = '';
    input.style.height = 'auto';

    const typing = addTyping();
    setLoading(true);

    try {
      const res = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
          history: history.slice(0, -1),
          source: SOURCE
        })
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const reply = data.response || 'Sorry, I didn\'t get a response. Please try again.';

      history.push({ role: 'assistant', content: reply });
      typing.remove();
      addMessage('bot', reply);

    } catch (err) {
      typing.remove();
      addMessage('bot', '⚠️ Something went wrong. Please try again in a moment.');
      console.error('[MIA Widget]', err);
    } finally {
      setLoading(false);
      input.focus();
    }
  }

  function addMessage(role, text) {
    const div = document.createElement('div');
    div.className = `mia-msg ${role}`;
    div.innerHTML = text
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
      .replace(/\*\*(.*?)\*\*/g,'<strong>$1</strong>')
      .replace(/\*(.*?)\*/g,'<em>$1</em>')
      .replace(/`(.*?)`/g,'<code>$1</code>')
      .replace(/\n/g,'<br>');
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  function addTyping() {
    const div = document.createElement('div');
    div.className = 'mia-typing';
    div.innerHTML = '<div class="mia-dot"></div><div class="mia-dot"></div><div class="mia-dot"></div>';
    msgs.appendChild(div);
    scrollToBottom();
    return div;
  }

  function scrollToBottom() { msgs.scrollTop = msgs.scrollHeight; }

  function setLoading(state) {
    isLoading = state;
    input.disabled = state;
    sendBtn.disabled = state;
  }

})();
