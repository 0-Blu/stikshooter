import { Server } from 'ws';

let wss;
let players = {};

export default (req, res) => {
  if (!res.socket.server.wss) {
    console.log("Initializing WebSocket server...");
    wss = new Server({ server: res.socket.server });
    res.socket.server.wss = wss;

    players = {}; // Reset on new instance (serverless limitation)

    wss.on('connection', (ws) => {
      console.log("New WebSocket connection established");

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          if (data.id) {
            players[data.id] = {
              x: data.x,
              y: data.y,
              health: data.health
            };
            console.log("Updated players:", JSON.stringify(players));
            wss.clients.forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(JSON.stringify(players));
              }
            });
          } else {
            console.log("Received message without ID:", message);
          }
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      });

      ws.on('close', () => {
        console.log("Client disconnected");
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(players));
          }
        });
      });
    });
  }

  if (req.headers['upgrade'] === 'websocket') {
    res.socket.server.wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      res.socket.server.wss.emit('connection', ws, req);
    });
  } else {
    res.status(200).end("Not a WebSocket request");
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
