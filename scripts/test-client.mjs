// Client de test manuel : flux complet REST + Socket.io
// Usage : node scripts/test-client.mjs
import { io } from "socket.io-client";

const BASE = "http://localhost:3000";

// 1) Auth invité -> token JWT
const authRes = await fetch(`${BASE}/auth/guest`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username: "Ethan" })
});
const { token } = await authRes.json();
console.log("token:", token.slice(0, 25) + "...");

// 2) Création de la room
const roomRes = await fetch(`${BASE}/rooms`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ gameId: "ninety-seven" })
});
const { room } = await roomRes.json();
console.log("room créée:", room.code);

// 3) Démarrage de la room (crée la game session)
await fetch(`${BASE}/rooms/${room.code}/start`, {
    method: "PATCH",
    headers: { Authorization: `Bearer ${token}` }
});
console.log("room démarrée");

// 4) Connexion Socket.io (token + roomCode dans handshake.auth)
const socket = io(BASE, { auth: { token, roomCode: room.code } });

socket.on("connect", () => console.log("socket connecté:", socket.id));
socket.on("connect_error", (e) => console.log("connect_error:", e.message));
socket.onAny((event, ...args) => console.log("EVENT", event, JSON.stringify(args)));

// Exemple d'action de jeu après 1s
setTimeout(() => {
    socket.emit("game:action", { action: "play-card", payload: { foo: "bar" } });
}, 1000);

// Coupe au bout de 4s
setTimeout(() => { socket.close(); process.exit(0); }, 4000);
