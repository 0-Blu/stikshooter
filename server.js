import { Server } from 'ws';

export default (req, res) => {
  // Check if WebSocket server is already initialized
  if (!res.socket.server.wss) {
    console.log("Initializing WebSocket server...");
    const wss = new Server({ noServer: true });
    res.socket.server.wss = wss;

    // Store players in memory (resets on new instance)
    const players = {};

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
        // Cleanup could be added here if we track ws to ID
        wss.clients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(players));
          }
        });
      });
    });

    // Handle WebSocket upgrades
    res.socket.server.on('upgrade', (request, socket, head) => {
      wss.handleUpgrade(request, socket, head, (ws) => {
        wss.emit('connection', ws, request);
      });
    });
  }

  // Respond to non-WebSocket requests
  if (req.headers['upgrade'] !== 'websocket') {
    res.status(200).json({ message: "This is a WebSocket endpoint. Connect using ws:// or wss://" });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
