
let currentUser = null;
let availableRooms = [];
let _uiBound = false;

function initRoomHandler(screenName) {
  console.log("in rooms");
  if (screenName && screenName.trim() !== '') {
    currentUser = screenName;
  } else {
    let el = document.getElementById('yourScreenName');
    if (el && el.textContent.trim() !== '') {
      currentUser = el.textContent.trim();
    }
  }

  if (_uiBound) return;

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      _bindUI();
      fetchRooms();
    });
  } else {
    _bindUI();
    fetchRooms();
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
    if (el && el.textContent.trim() !== '') {
      currentUser = el.textContent.trim();
    }
  }
  if (!currentUser) {
    alert('You must be logged in to create a room');
    return;
  }

  let overlay = document.getElementById('roomOverlay');
  if (!overlay) return;
  document.getElementById('roomName').value = '';
  document.getElementById('roomKey').value = '';
  let err = document.getElementById('roomFormError');
  if (err) err.textContent = '';
  overlay.style.display = 'flex';
  let rn = document.getElementById('roomName');
  if (rn) rn.focus();
}

function closeRoomOverlay() {
  let overlay = document.getElementById('roomOverlay');
  if (overlay) overlay.style.display = 'none';
}

function fetchRooms() {
  console.log("in fetch rooms");
  fetch('rooms.php', { method: 'GET', cache: 'no-store' })
    .then(res => res.json())
    .then(json => {
      console.log(json, "====================");
      availableRooms = [];
      let container = document.getElementById('availableRooms');
      container.innerHTML = '';

      json.rooms.forEach(function(r) {
        if (!r.key) r.key = "";
        addRoomToList(r);
      });
    })
    .catch(function(err) {
      console.log("error", err);
    });
}

function addRoomToList(room) {
  if (!room || !room.name) return;
  for (let i = 0; i < availableRooms.length; i++) {
    if (availableRooms[i].name === room.name) return;
  }
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
  (function(r) {
    btn.addEventListener('click', function() {
      if (typeof joinRoom === 'function') {
        if (r.key) {
          let provided = prompt('Room is locked. Enter key:') || '';
          joinRoom(r.name, provided);
        } else {
          joinRoom(r.name, '');
        }
      } else {
        let cr = document.getElementById('currentRoom');
        if (cr) cr.textContent = r.name;
        let messagesDiv = document.getElementById('messages');
        if (messagesDiv) messagesDiv.innerHTML = '';
      }
    });
  })(room);

  container.appendChild(row);
}

function submitRoomForm(ev) {
  ev.preventDefault();
  let errDiv = document.getElementById('roomFormError');
  if (errDiv) errDiv.textContent = '';

  let name = (document.getElementById('roomName').value || '').trim();
  let key = (document.getElementById('roomKey').value || '').trim();

  if (!name) {
    if (errDiv) errDiv.textContent = 'Room name cannot be empty';
    document.getElementById('roomName').focus();
    return;
  }
  if (name.length > 100) {
    if (errDiv) errDiv.textContent = 'Room name too long';
    document.getElementById('roomName').focus();
    return;
  }

  for (let i = 0; i < availableRooms.length; i++) {
    if (availableRooms[i].name === name) {
      if (errDiv) errDiv.textContent = 'Room already exists; choose another name';
      return;
    }
  }

  let payload = { name: name, key: key, creator: currentUser || '' };

  fetch('rooms.php', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  })
  .then(function(res) { return res.json(); })
  .then(function(json) {
    if (json && json.success) {
      addRoomToList({ name: name, key: key, creatorUsername: currentUser });
      closeRoomOverlay();
    } else {
      let msg = (json && json.message) ? json.message : 'Server error';
      if (errDiv) errDiv.textContent = msg;
    }
  })
  .catch(function() {
    if (errDiv) errDiv.textContent = 'Network error. Try again.';
  });
}

function escapeHtml(s) {
  if (!s) return '';
  return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}

window.initRoomHandler = initRoomHandler;
