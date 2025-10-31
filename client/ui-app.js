/* ui-app.js — robust live chat: queue, reconnect, heartbeat, on-screen status */
(() => {
  const $ = (id) => document.getElementById(id);

  const API = {
    signup: '/server/signup.php',
    login:  '/server/login.php',
    logout: '/server/logout.php',
    rooms:  '/server/rooms.php',
  };

  const host  = location.hostname || '127.0.0.1';
  const WS_URL = `ws://${host}:8080`;   // match server/chatServer.php

  let ws = null;
  let wsReady = false;
  let queue = [];                       // frames waiting until socket opens
  let hbTimer = null;
  let reconnectTimer = null;

  let authed = false;
  let screenName = '';
  let currentRoom = '';

  function setBadge(text, ok) {
    let b = document.getElementById('wsBadge');
    if (!b) {
      b = document.createElement('div');
      b.id = 'wsBadge';
      b.style.cssText = 'position:fixed;right:10px;bottom:10px;padding:6px 10px;border:1px solid #888;background:#fff;font:12px/1.2 system-ui;z-index:99999';
      document.body.appendChild(b);
    }
    b.textContent = `WS: ${text}`;
    b.style.borderColor = ok ? '#4caf50' : '#c00';
    b.style.color = ok ? '#2e7d32' : '#c00';
  }

  function setAuthed(on, name='') {
    authed = on;
    if (name) screenName = name;
    $('signupBtn').classList.toggle('hide', on);
    $('loginBtn').classList.toggle('hide', on);
    $('logoutBtn').classList.toggle('hide', !on);
    $('authArea').style.display = on ? 'none' : '';
    $('appArea').style.display  = on ? 'grid' : 'none';

    if (on) {
      loadRooms();
      connectWS();
    } else {
      closeWS();
      $('rooms').innerHTML = '';
      $('messages').innerHTML = '';
      $('currentRoom').textContent = 'Current Room name';
      currentRoom = '';
    }
  }
  window.setAuthed = setAuthed;

  // UI wiring
  window.addEventListener('DOMContentLoaded', () => {
    $('helpBtn').onclick   = () => $('helpOverlay').style.display = 'flex';
    $('helpClose').onclick = () => $('helpOverlay').style.display = 'none';
    $('signupBtn').onclick = () => { $('signupForm').style.display='block'; $('loginForm').style.display='none'; };
    $('loginBtn').onclick  = () => { $('loginForm').style.display='block';  $('signupForm').style.display='none'; };
    $('createRoomBtn').onclick = createRoomFlow;
    $('sendBtn').onclick   = sendMessage;
    $('chatInput').addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); sendMessage(); }});
  });

  // Auth flows
  document.addEventListener('submit', async (e) => {
    if (e.target.id === 'formSignup') {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const r = await fetch(API.signup, { method:'POST', body:fd });
        const j = await r.json();
        if (j.success) {
          setAuthed(true, j.screenName || fd.get('screenName') || '');
          $('signupErrors').textContent = ''; e.target.reset(); $('signupForm').style.display='none';
        } else { $('signupErrors').textContent = j.error || 'Signup failed'; }
      } catch { $('signupErrors').textContent = 'Network error during signup'; }
    }
    if (e.target.id === 'formLogin') {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const r = await fetch(API.login, { method:'POST', body:fd });
        const j = await r.json();
        if (j.success) {
          setAuthed(true, j.screenName || j.screen_name || '');
          $('loginErrors').textContent = ''; e.target.reset(); $('loginForm').style.display='none';
        } else { $('loginErrors').textContent = j.error || 'Login failed'; }
      } catch { $('loginErrors').textContent = 'Network error during login'; }
    }
  });

  $('logoutBtn').addEventListener('click', async () => {
    try { await fetch(API.logout, { method:'POST' }); } catch {}
    setAuthed(false);
  });

  // Rooms
  async function loadRooms() {
    try {
      const r = await fetch(API.rooms, { cache:'no-cache' });
      const j = await r.json().catch(()=>({rooms:[]}));
      renderRooms(Array.isArray(j) ? j : (j.rooms || []));
    } catch { renderRooms([]); }
  }

  function renderRooms(list) {
    const tbody = $('rooms');
    tbody.innerHTML = '';
    if (!list.length) {
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 3; td.style.color = '#666';
      td.textContent = 'Scrollable div/table with rows. Each row has 3 columns showing chatroom name, open or closed lock image (or png) and Join button';
      tr.appendChild(td); tbody.appendChild(tr);
      return;
    }
    list.forEach(r => {
      const name = r.name || r.roomName || 'Room';
      const locked = !!(r.locked || r.private || r.isLocked);
      const tr = document.createElement('tr');

      const t1 = document.createElement('td'); t1.className='name';   t1.textContent = name;
      const t2 = document.createElement('td'); t2.className='status'; t2.innerHTML = `${locked?'🔒 closed':'🔓 open'}`;
      const t3 = document.createElement('td'); t3.className='join';
      const btn = document.createElement('button'); btn.className='btn-join'; btn.textContent='Join';
      btn.onclick = () => joinRoom(name, locked);
      t3.appendChild(btn);

      tr.appendChild(t1); tr.appendChild(t2); tr.appendChild(t3);
      tbody.appendChild(tr);
    });
  }

  async function createRoomFlow() {
    const name = (prompt('Enter new chatroom name:')||'').trim();
    if (!name) return;
    const key  = (prompt('Optional room key:')||'').trim();
    try {
      await fetch(API.rooms, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'create', name, key }) });
    } catch {}
    loadRooms();
  }

  async function joinRoom(name, locked) {
    if (!authed) return alert('Please login first.');
    let key = ''; if (locked) key = prompt('Room key:') || '';
    try {
      await fetch(API.rooms, { method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ action:'join', name, key }) });
    } catch {}
    currentRoom = name;
    $('currentRoom').textContent = currentRoom;
    $('messages').innerHTML = '';
    sendOrQueue({ type:'join', room: currentRoom, screenName });
  }

  // WebSocket with queue/reconnect/heartbeat
  function connectWS() {
    if (ws && (ws.readyState === 0 || ws.readyState === 1)) return; // connecting or open

    try { ws = new WebSocket(WS_URL); }
    catch (e) { console.warn('WS create failed', e); scheduleReconnect(); return; }

    setBadge('Connecting…', false);
    wsReady = false;

    ws.onopen = () => {
      wsReady = true;
      setBadge('Connected', true);
      // Identify
      sendRaw({ type:'hello', screenName });
      // Join, if already in a room
      if (currentRoom) sendRaw({ type:'join', room: currentRoom, screenName });
      // Flush queue
      while (queue.length && wsReady) sendRaw(queue.shift());
      // Heartbeat
      clearInterval(hbTimer);
      hbTimer = setInterval(()=> sendRaw({type:'ping'}), 15000);
    };

    ws.onmessage = (ev) => {
      let msg; try { msg = JSON.parse(ev.data); } catch { return; }
      if (msg.room && currentRoom && msg.room !== currentRoom) return;
      if (msg.type === 'system' && msg.notice) { addMsg('*', msg.notice); return; }
      if (msg.type === 'message' && msg.text) {
        const who = msg.screenName || 'Unknown';
        if (who !== screenName) addMsg(who, msg.text, false);
      }
    };

    ws.onclose = () => {
      wsReady = false;
      setBadge('Disconnected', false);
      clearInterval(hbTimer);
      scheduleReconnect();
    };

    ws.onerror = () => {
      try { ws.close(); } catch {}
    };
  }

  function scheduleReconnect() {
    clearTimeout(reconnectTimer);
    reconnectTimer = setTimeout(connectWS, 1200);
  }

  function closeWS() {
    wsReady = false;
    clearInterval(hbTimer);
    clearTimeout(reconnectTimer);
    if (ws) { try { ws.close(); } catch {} ws = null; }
    setBadge('Disconnected', false);
  }

  function sendRaw(obj) {
    if (!ws || ws.readyState !== 1) return;
    ws.send(JSON.stringify(obj));
  }
  function sendOrQueue(obj) {
    if (wsReady) sendRaw(obj); else queue.push(obj);
  }

  function sendMessage() {
    if (!authed) return alert('Please login first.');
    if (!currentRoom) return alert('Join a room first.');
    const input = $('chatInput');
    const text = (input.value || '').trim();
    if (!text) return;

    // show my message immediately
    addMsg('me', text, true);
    // send to server for others
    sendOrQueue({ type:'message', room: currentRoom, screenName, text });
    input.value = '';
  }
  window.sendMessage = sendMessage;

  function addMsg(who, text, isMe=false) {
    const box = $('messages');
    const div = document.createElement('div');
    div.className = 'msg';
    const label = isMe ? '[me:]' : `[${who}:]`;
    div.innerHTML = `<span class="who">${label}</span>${escapeHtml(text)}`;
    box.appendChild(div);
    box.scrollTop = box.scrollHeight;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  }

  // expose for server callbacks if ever needed
  window.connectWS = connectWS;
})();
