let currentUser = null;
let availableRooms = [];
let _uiBound = false;

function initRoomHandler(screenName) {
  if (screenName && screenName.trim() !== '') {
    currentUser = screenName;
  } else {
    let el = document.getElementById('yourScreenName');
    if (el && el.textContent.trim() !== '') currentUser = el.textContent.trim();
  }
  if (_uiBound) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => { _bindUI(); fetchRooms(); });
  } else {
    _bindUI(); fetchRooms();
  }
}

function _bindUI() {
  if (_uiBound) return;
  _uiBound = true;

  let btn = document.getElementById('createRoomBtn');
  if (btn) btn.addEventListener('click', openRoomOverlay);

  let cancel = document.getElementById('roomCancel');
  if (cancel) cancel.addEventListener('click', closeRoomOverlay);

  let form = document.getElementById('roomForm');
  if (form) form.addEventListener('submit', submitRoomForm);
}

function openRoomOverlay() {
  if (!currentUser) {
    let el = document.getElementById('yourScreenName');
    if (el && el.textContent.trim() !== '') currentUser = el.textContent.trim();
  }
  if (!currentUser) { alert('You must be logged in to create a room'); return; }

  let overlay = document.getElementById('roomOverlay');
  if (!overlay) return;
  document.getElementById('roomName').value = '';
  document.getElementById('roomKey').value = '';
  let err = document.getElementById('roomFormError'); if (err) err.textContent = '';
  overlay.style.display = 'flex';
  let rn = document.getElementById('roomName'); if (rn) rn.focus();
}

function closeRoomOverlay() {
  let overlay = document.getElementById('roomOverlay');
  if (overlay) overlay.style.display = 'none';
}

function fetchRooms() {
  fetch('../server/rooms.php', { method: 'GET', cache: 'no-store' })
    .then(res => res.json())
    .then(json => {
      availableRooms = [];
      let container = document.getElementById('availableRooms');
      container.innerHTML = '';
      (json.rooms || json.rooms === undefined ? json.rooms : []).forEach(() => {}); // noop for safety

      const rooms = (json.rooms && Array.isArray(json.rooms)) ? json.rooms : (json.success && json.rooms ? json.rooms : []);
      (rooms || []).forEach((r) => {
        if (!r.key) r.key = '';
        addRoomToList(r);
      });
    })
    .catch(err => console.log('rooms error', err));
}

function addRoomToList(room) {
  if (!room || !room.name) return;
  if (availableRooms.some(r => r.name === room.name)) return;

  availableRooms.push(room);
  let container = document.getElementById('availableRooms');
  if (!container) return;

  let row = document.createElement('div');
  row.className = 'roomRow';
  row.style.padding = '6px';
  row.style.borderBottom = '1px solid #eee';
  row.innerHTML =
    "<span style='display:inline-block;width:200px;'>" + escapeHtml(room.name) + "</span>" +
    "<span style='display:inline-block;width:40px;'>" + (room.key ? "🔒" : "🔓") + "</span>" +
    "<button class='joinBtn'>Join</button>";

  let btn = row.querySelector('.joinBtn');
  btn.addEventListener('click', function() {
    let providedKey = '';
    if (room.key) providedKey = prompt('Room is locked. Enter key:') || '';
    joinRoom(room.name, providedKey);
  });

  container.appendChild(row);
}

function submitRoomForm(ev) {
  ev.preventDefault();
  let errDiv = document.getElementById('roomFormError');
  if (errDiv) errDiv.textContent = '';

  let name = (document.getElementById('roomName').value || '').trim();
  let key  = (document.getElementById('roomKey').value || '').trim();

  if (!name) { if (errDiv) errDiv.textContent = 'Room name cannot be empty'; return; }
  if (name.length > 100) { if (errDiv) errDiv.textContent = 'Room name too long'; return; }

  if (availableRooms.some(r => r.name === name)) { if (errDiv) errDiv.textContent = 'Room already exists'; return; }

  const payload = { name, key, creator: currentUser || '' };
  fetch('../server/rooms.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(json => {
      if (json && json.success) {
        const roomData = { name, key, creatorUsername: currentUser };
        addRoomToList(roomData);
        closeRoomOverlay();
        // Broadcast to others via WS
        if (socket && socket.readyState === WebSocket.OPEN) {
          socket.send(JSON.stringify({ type: 'newRoom', room: roomData }));
        }
      } else {
        let msg = (json && json.message) ? json.message : 'Server error';
        if (errDiv) errDiv.textContent = msg;
      }
    })
    .catch(() => { if (errDiv) errDiv.textContent = 'Network error. Try again.'; });
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

function joinRoom(roomName, providedKey) {
  const payload = { action: 'joinRoom', roomName, key: providedKey };
  fetch('../server/rooms.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        document.getElementById('currentRoom').textContent = roomName;
        // Tell WS we joined (no message content here)
        if (socket) {
          socket.send(JSON.stringify({ type: 'joinRoom', roomName, screenName: document.getElementById('yourScreenName').textContent, message: '' }));
        }
      } else {
        alert('Failed to join room: ' + data.message);
      }
    })
    .catch(() => alert('Network error while joining room.'));
}

window.initRoomHandler = initRoomHandler;
