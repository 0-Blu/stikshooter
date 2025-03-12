const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

// Player object
let player = {
  x: 400,
  y: 300,
  radius: 20,
  speed: 5,
  angle: 0,
  health: 100,
  id: null // Unique ID for this player
};

// Multiplayer state
let allPlayers = {};
let bullets = [];

// Input handling
let keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

// Mouse handling
let mouse = { x: 0, y: 0 };
canvas.addEventListener("mousemove", (e) => {
  mouse.x = e.clientX - canvas.offsetLeft;
  mouse.y = e.clientY - canvas.offsetTop;
});
canvas.addEventListener("click", () => {
  bullets.push({
    x: player.x,
    y: player.y,
    speed: 10,
    angle: Math.atan2(mouse.y - player.y, mouse.x - player.x)
  });
});

// WebSocket connection
const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/server`);
ws.onopen = () => {
  console.log("Connected to server");
  player.id = Date.now(); // Assign a unique ID on connection
  // Initial send to register player
  ws.send(JSON.stringify({ id: player.id, x: player.x, y: player.y, health: player.health }));
};
ws.onmessage = (event) => {
  allPlayers = JSON.parse(event.data);
  console.log("Players received:", allPlayers); // Debug log
};
ws.onerror = (error) => console.error("WebSocket error:", error);
ws.onclose = () => console.log("WebSocket closed");

function update() {
  // Movement
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  // Keep player in bounds
  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  // Update angle
  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  // Update bullets
  bullets.forEach((bullet, index) => {
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(index, 1);
    }
  });

  // Send player data to server
  if (ws.readyState === WebSocket.OPEN && player.id) {
    ws.send(JSON.stringify({ id: player.id, x: player.x, y: player.y, health: player.health }));
  }
}

function draw() {
  // Clear canvas with black background
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw all players
  for (let id in allPlayers) {
    const p = allPlayers[id];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = (id === player.id.toString()) ? "blue" : "red"; // Ensure ID is string
    ctx.fill();
    ctx.closePath();

    // Draw health bar
    ctx.fillStyle = "green";
    ctx.fillRect(p.x - 20, p.y - 30, (p.health / 100) * 40, 5);
  }

  // Draw bullets
  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "yellow"; // Changed to yellow for visibility on black
    ctx.fill();
    ctx.closePath();
  });

  // Debug: Draw local player if not in allPlayers yet
  if (!allPlayers[player.id]) {
    ctx.beginPath();
    ctx.arc(player.x, player.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = "blue";
    ctx.fill();
    ctx.closePath();
  }
}

function gameLoop() {
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
