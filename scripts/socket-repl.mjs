import { io } from "socket.io-client";
import readline from "node:readline";

const BASE = process.env.API_URL || "http://localhost:3000";
const USERNAME = process.env.USERNAME || "Ethan";

let [, , argCode, argToken] = process.argv;

async function setup() {
    if (argCode && argToken) {
        return { roomCode: argCode, token: argToken };
    }
    const auth = await (await fetch(`${BASE}/auth/guest`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: USERNAME })
    })).json();
    const token = auth.token;

    let roomCode = argCode;

    if (!roomCode) {
        const response = await fetch(`${BASE}/rooms`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ gameId: "pmu" })
        });
        const data = await response.json();

        console.log(data)
        
        roomCode = data.room.code; 
    }

    console.log(roomCode)

    await fetch(`${BASE}/rooms/${roomCode}/start`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` }
    });

    return { roomCode: roomCode, token };
}

const { roomCode, token } = await setup();
console.log(`\n  room: ${roomCode}`);
console.log(`  token: ${token.slice(0, 25)}...\n`);

const socket = io(BASE, { auth: { token, roomCode } });

const rl = readline.createInterface({ input: process.stdin, output: process.stdout, prompt: "> " });

socket.on("connect", () => {
    console.log(`connecté (${socket.id})`);
    printHelp();
    rl.prompt();
});
socket.on("connect_error", (e) => console.log(`✗ connect_error: ${e.message}`));
socket.on("disconnect", (r) => console.log(`✗ déconnecté: ${r}`));

socket.onAny((event, ...args) => {
    console.log(`\n${event} ${JSON.stringify(args.length === 1 ? args[0] : args)}`);
    rl.prompt();
});

function printHelp() {
    console.log(`
Commandes :
  action <nom> <json>   émet "game:action" {action, payload}   ex: action play-card {"suit":"clubs","rank":"A"}
  emit <event> <json>   émet un event arbitraire               ex: emit game:action {"action":"draw","payload":{}}
  help                  réaffiche cette aide
  exit                  quitte
`);
}

rl.on("line", (line) => {
    const input = line.trim();
    if (!input) return rl.prompt();

    if (input === "exit" || input === "quit") { socket.close(); rl.close(); return; }
    if (input === "help") { printHelp(); return rl.prompt(); }

    const [cmd, ...rest] = input.split(/\s+/);

    try {
        if (cmd === "action") {
            const action = rest.shift();
            const payload = rest.length ? JSON.parse(rest.join(" ")) : {};
            socket.emit("game:action", { action, payload });
            console.log(`game:action {action:"${action}", payload:${JSON.stringify(payload)}}`);
        } else if (cmd === "emit") {
            const event = rest.shift();
            const data = rest.length ? JSON.parse(rest.join(" ")) : {};
            socket.emit(event, data);
            console.log(`→ ${event} ${JSON.stringify(data)}`);
        } else {
            console.log(`commande inconnue: "${cmd}" (tape "help")`);
        }
    } catch (e) {
        console.log(`erreur JSON: ${e.message}`);
    }
    rl.prompt();
});

rl.on("close", () => process.exit(0));
