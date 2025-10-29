
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
        document.getElementById("messages").innerHTML += "<div>disconnected from server</div>";
        };
        socket.onmessage = function(event) {
        document.getElementById("messages").innerHTML += "<div style='color':blue>Server says: "+event.data+"</div>";
        };
    }

    function sendMessage() {
    if (!socket) alert("Connect first");
    else if ((message=document.getElementById("chatInput").value).length==0) alert("Can't send empty string");
    else {
            console.log("message being send now");
                socket.send(message);
            document.getElementById("messages").innerHTML += "<div style='color':blue>Client says: "+message+"</div>";
                document.getElementById("chatInput").value = "";
    }
}
function disconnectFromServer() {
    console.log("disconnected from the server");
    if (socket)socket.close();
    //document.getElementById("disconnectButton").style.display="none";
    //ocument.getElementById("connectButton").style.display="block";
    document.getElementById("messages").innerHTML += "<div style='color:red'>Disconnected from server</div>";
    socket=false;
}

