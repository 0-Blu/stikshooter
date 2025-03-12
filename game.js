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
  id: null
};

let allPlayers = {};
let bullets = [];

let keys = {};
window.addEventListener("keydown", (e) => keys[e.key] = true);
window.addEventListener("keyup", (e) => keys[e.key] = false);

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

const ws = new WebSocket(`${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/server`);
ws.onopen = () => {
  console.log("Connected to server");
  player.id = Date.now().toString();
  ws.send(JSON.stringify({ id: player.id, x: player.x, y: player.y, health: player.health }));
};
ws.onmessage = (event) => {
  allPlayers = JSON.parse(event.data);
  console.log("Players received:", allPlayers);
};
ws.onerror = (error) => console.error("WebSocket error:", error);
ws.onclose = () => console.log("WebSocket closed");

function update() {
  if (keys["w"]) player.y -= player.speed;
  if (keys["s"]) player.y += player.speed;
  if (keys["a"]) player.x -= player.speed;
  if (keys["d"]) player.x += player.speed;

  player.x = Math.max(player.radius, Math.min(canvas.width - player.radius, player.x));
  player.y = Math.max(player.radius, Math.min(canvas.height - player.radius, player.y));

  player.angle = Math.atan2(mouse.y - player.y, mouse.x - player.x);

  bullets.forEach((bullet, index) => {
    bullet.x += Math.cos(bullet.angle) * bullet.speed;
    bullet.y += Math.sin(bullet.angle) * bullet.speed;
    if (bullet.x < 0 || bullet.x > canvas.width || bullet.y < 0 || bullet.y > canvas.height) {
      bullets.splice(index, 1);
    }
  });

  if (ws.readyState === WebSocket.OPEN && player.id) {
    ws.send(JSON.stringify({ id: player.id, x: player.x, y: player.y, health: player.health }));
  }
}

function draw() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  for (let id in allPlayers) {
    const p = allPlayers[id];
    ctx.beginPath();
    ctx.arc(p.x, p.y, 20, 0, Math.PI * 2);
    ctx.fillStyle = (id === player.id) ? "blue" : "red";
    ctx.fill();
    ctx.closePath();

    ctx.fillStyle = "green";
    ctx.fillRect(p.x - 20, p.y - 30, (p.health / 100) * 40, 5);
  }

  bullets.forEach(bullet => {
    ctx.beginPath();
    ctx.arc(bullet.x, bullet.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = "yellow";
    ctx.fill();
    ctx.closePath();
  });

  if (player.id && !allPlayers[player.id]) {
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
