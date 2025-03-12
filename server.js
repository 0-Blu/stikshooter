import { Server } from 'ws';

// Serverless WebSocket function for Vercel
export default (req, res) => {
  if (!res.socket.server.wss) {
    console.log("Initializing WebSocket server...");
    const wss = new Server({ server: res.socket.server });
    res.socket.server.wss = wss;

    let players = {};

    wss.on('connection', (ws) => {
      let id = Date.now();
      players[id] = { x: 400, y: 300, health: 100 };
      console.log(`Player ${id} connected`);

      ws.on('message', (message) => {
        try {
          let data = JSON.parse(message);
          players[id].x = data.x;
          players[id].y = data.y;
          players[id].health = data.health;

          // Broadcast to all clients
          wss.clients.forEach(client => {
            if (client.readyState === WebSocket.OPEN) {
              client.send(JSON.stringify(players));
            }
          });
        } catch (e) {
          console.error("Error parsing message:", e);
        }
      });

      ws.on('close', () => {
        delete players[id];
        console.log(`Player ${id} disconnected`);
      });
    });
  }

  // Handle WebSocket upgrade
  if (req.headers['upgrade'] === 'websocket') {
    res.socket.server.wss.handleUpgrade(req, req.socket, Buffer.alloc(0), (ws) => {
      res.socket.server.wss.emit('connection', ws, req);
    });
  } else {
    res.status(200).end();
  }
};

export const config = {
  api: {
    bodyParser: false,
  },
};
