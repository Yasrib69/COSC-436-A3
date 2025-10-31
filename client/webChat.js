var socket = false;

function connectToServer() {
  if (socket) { alert("Already connected"); return; }
  socket = new WebSocket("ws://" + window.location.hostname + ":8080");

  socket.onopen = function() {
    const m = document.getElementById("messages");
    if (m) m.innerHTML += "<div style='color:red'>Connected to server</div>";
  };

  socket.onclose = function() {
    console.log("Socket closed");
  };

  socket.onmessage = function(event) {
    try {
      const data = JSON.parse(event.data);

      if (data.type === "newRoom") {
        // Add to UI if not already listed
        if (typeof addRoomToList === 'function' && data.room && data.room.name) {
          addRoomToList({ name: data.room.name, key: data.room.key || "" });
        }
        return;
      }

      if (data.type === "message") {
        const sender = data.screenName || "Unknown";
        const msg = data.message || "";
        document.getElementById("messages").innerHTML += `<div><b>${sender}:</b> ${msg}</div>`;
        return;
      }

      // ignore unknown types quietly
    } catch (e) {
      console.error("Invalid JSON:", e);
    }
  };
}

function sendMessage() {
  if (!socket) return alert("Connect first");

  const message = document.getElementById("chatInput").value.trim();
  if (message.length === 0) return alert("Can't send empty message");

  const screenName = document.getElementById('yourScreenName').textContent;
  const roomName   = document.getElementById('currentRoom').textContent;
  if (roomName === "Not in a room") return alert("Must be in a room to send messages");

  const payload = JSON.stringify({
    type: 'message',
    roomName, screenName, message
  });

  socket.send(payload);
  document.getElementById("messages").innerHTML += `<div style='color:blue'><b>Me:</b> ${message}</div>`;
  document.getElementById("chatInput").value = "";
}

function disconnectFromServer() {
  if (socket) socket.close();
  const m = document.getElementById("messages");
  if (m) { m.innerHTML += "<div style='color:red'>Disconnected from server</div>"; m.innerHTML = ""; }
  socket = false;
}
