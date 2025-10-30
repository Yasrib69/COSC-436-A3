
var socket=false;

// connect to server web socket
    function connectToServer() {
    if (socket) {
        alert("Already connected");
        console.log("already start");
        return;
    }
        socket = new WebSocket("ws://"+window.location.hostname+":8080");
        console.log("web socket started");
    //document.getElementById("disconnectButton").style.display="block";
    //document.getElementById("connectButton").style.display="none";
    // Event handlers
        socket.onopen = function(event) {
        document.getElementById("messages").innerHTML += "<div style='color:red'>Connected to server</div>";
        };
        socket.onclose = function(event) {
            console.log("Disconnecting from server. socket closed on its own, idling");
        //document.getElementById("messages").innerHTML += "<div>disconnected from server</div>";
        };
        socket.onmessage = function(event) {
            try {
                const data = JSON.parse(event.data); // lading
                if (data.type === "newRoom") {
                    console.log("New room broadcast received:", data);
                    // Only add to UI if it's not already listed
                    addRoomToList({
                        name: data.room.name,
                        key: data.room.key || ""
                    });
                }
                else if (data.type == "message"){
                    console.log(" receiving messayfr from type joinROOOOOOOOm");
                    const sender = data.screenName || "Unknown";
                    console.log("sender ++++++++++++++++++++++++++ " + sender);
                    console.log("room ++++++++++++++++++++++++++ " + data.roomName);
                    const msg = data.message || "";
                    console.log(msg);
                    document.getElementById("messages").innerHTML += `<div><b>${sender}:</b> ${msg}</div>`;
                }
                else {
                    console.log("no types");
                    console.log(data.type);
                 //   const data = JSON.parse(event.data);
                 //   const sender = data.screenName || "Unknown";
                 //   const msg = data.message || "";
                 //   document.getElementById("messages").innerHTML += `<div><b>${sender}:</b> ${msg}</div>`;
                }
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
        const roomName = document.getElementById('currentRoom').textContent;
        if(roomName === "Not in a room") return alert("Must be in a room to send messages");
        console.log("innnnnnnnnnnnnndfffffffffffffffffffffffffkkkkkkkkkkkkkkkkk");
        const payload = JSON.stringify({
            type: 'message',
            roomName: roomName,
            screenName: screenName,
            message: message
          });
        //const payload = JSON.stringify({ roomName, screenName, message });
    
        socket.send(payload);
        document.getElementById("messages").innerHTML += `<div style='color:blue'><b>Me:</b> ${message}</div>`;
        document.getElementById("chatInput").value = "";
    }
    
function disconnectFromServer() {
    console.log("disconnected from the server");
    if (socket)socket.close();
    //document.getElementById("disconnectButton").style.display="none";
    //ocument.getElementById("connectButton").style.display="block";
    document.getElementById("messages").innerHTML += "<div style='color:red'>Disconnected from server</div>";
    document.getElementById("messages").innerHTML = "";
    socket=false;
}

