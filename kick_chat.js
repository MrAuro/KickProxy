import WebSocket from "ws";
import net from "net";

const SERVER_PORT = 8080;
const SERVER_HOST = "localhost";
const USER_ID = "668";
const USER_LOGIN = "xqc";

const socket = new WebSocket(
  "wss://ws-us2.pusher.com/app/eb1d5f283081a78b932c?protocol=7&client=js&version=7.6.0&flash=false"
);

let state = 0;
const clients = [];
const channels = {};

// Event listener for when the connection is established
socket.addEventListener("open", () => {
  console.log("WebSocket connection established");
});

// Event listener for incoming messages
socket.addEventListener("message", handleMessage);

// Event listener for errors
socket.addEventListener("error", (event) => {
  console.error("WebSocket error:", event);
});

// Event listener for when the connection is closed
socket.addEventListener("close", () => {
  console.log("WebSocket connection closed");
});

const ircServer = net.createServer(handleClientConnect);

// Start listening for incoming connections
ircServer.listen(SERVER_PORT, SERVER_HOST, () => {
  console.log(`IRC server running on ${serverHost}:${serverPort}`);
});

function handleMessage(event) {
  const message = JSON.parse(event.data);
  const messageData = JSON.parse(message.data);

  if (messageData?.type === "message") {
    const content = messageData.content;
    const pattern = /\[emote:\d+:(\w+)\]/g;
    const outputString = content.replace(
      pattern,
      (_, captureGroup) => captureGroup
    );

    broadcast(
      `:${messageData.sender.username} PRIVMSG #${USER_LOGIN} :${outputString}\r\n`
    );
  }

  if (state === 0) {
    socket.send(
      JSON.stringify({
        event: "pusher:subscribe",
        data: {
          channel: `chatrooms.${USER_ID}.v2`,
          auth: null,
        },
      })
    );
    state = 1;
  }
}

function handleClientConnect(socket) {
  console.log(
    `New client connected: ${socket.remoteAddress}:${socket.remotePort}`
  );

  const client = {
    socket,
    nick: `user${clients.length + 1}`,
  };

  clients.push(client);

  client.socket.write(`Connected to proxy, ${client.nick}!\n`);

  client.socket.on("data", () => null);

  client.socket.on("end", () => {
    console.log(`Client disconnected: ${client.nick}`);
    const index = clients.indexOf(client);
    if (index !== -1) {
      clients.splice(index, 1);
    }

    Object.values(channels).forEach((channel) => {
      const memberIndex = channel.members.indexOf(client);
      if (memberIndex !== -1) {
        channel.members.splice(memberIndex, 1);
      }
    });
  });
}

function broadcast(message) {
  clients.forEach((client) => {
    client.socket.write(message);
  });
}
