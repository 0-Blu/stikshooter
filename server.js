import { Server } from 'ws';

let wss;
let players = {};

export default async (req, res) => {
  try {
    if (!res.socket.server.wss) {
      console.log("Initializing WebSocket server...");
      wss = new Server({ noServer: true }); // Use noServer mode
      res.socket.server.wss = wss;
      players = {}; // Reset players for this instance

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

      // Attach WebSocket to the server
      res.socket.server.on('upgrade', (request, socket, head) => {
        wss.handleUpgrade(request, socket, head, (ws) => {
          wss.emit('connection', ws, request);
        });
      });
    }

    // Handle WebSocket upgrade request
    if (req.headers['upgrade'] === 'websocket') {
      // Let the upgrade happen, already handled by the server 'upgrade' event
      return;
    } else {
      // Handle non-WebSocket requests
      res.status(200).json({ message: "This is a WebSocket endpoint. Connect using ws:// or wss://" });
    }
  } catch (error) {
    console.error("Server error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
