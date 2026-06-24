import { Socket } from "socket.io";
import { IEventParams, SocketData } from "../../../realtime/types.js";
import BaseGame from "../../games/base-game.js";
import GameSessionService from "../game-session.service.js";
import gameSessionRooms from "./game-session.rooms.js";

const connectedPlayersBySession = new Map<string, Set<string>>();
const socketsBySession = new Map<string, Map<string, Socket>>();

const initializedSessions = new Set<string>();

const gameSessionService = new GameSessionService();

export const registerGameSessionEvents = async ({ socket, io }: IEventParams) => {
    const data = socket.data as SocketData;
    const userId = data.user.id!;
    const userName = data.user.username;

    const gameSession = data.gameSession;

    const sessionId = gameSession.id;
    const gameRoomName = gameSessionRooms.getRoomName(sessionId);

    socket.join(gameRoomName);

    const connectedPlayers = connectedPlayersBySession.get(sessionId) ?? new Set<string>();
    connectedPlayers.add(userId);
    connectedPlayersBySession.set(sessionId, connectedPlayers);

    let sessionSockets = socketsBySession.get(sessionId);

    if (!sessionSockets) {
        sessionSockets = new Map<string, Socket>();
        socketsBySession.set(sessionId, sessionSockets);
    }

    sessionSockets.set(userId, socket);
    
    gameSessionRooms.broadcast(io, {
        sessionId,
        eventName: "game:player-joined",
        data: {
            id: userId,
            username: userName
        }
    });

    const allPlayersConnected =
        connectedPlayers.size === gameSession.playersSnapshot.length;

    const alreadyInitialized = initializedSessions.has(sessionId);

    if (allPlayersConnected && !alreadyInitialized) {
        try {
            initializedSessions.add(sessionId);

            const gameInstance = BaseGame.loadById(gameSession.gameId, {
                sessionId: gameSession.id,
                players: gameSession.playersSnapshot,
                state: gameSession.state,
                io,
                sockets: socketsBySession
            });

            await gameInstance.initialize();
            socket.on("game:action", async ({action, payload}) => {
                if(!action || !payload) return;
                await gameInstance.handleAction(
                    userId,
                    action, 
                    payload
                )
            });
        } catch(e) {
            const error = e as Error;
            socket.emit("game:error", {
                error: error.message
            });
        }
    }

    socket.on("disconnect", async () => {
        connectedPlayers.delete(userId);

        if (connectedPlayers.size === 0) {
            connectedPlayersBySession.delete(sessionId);
            initializedSessions.delete(sessionId);
            await gameSessionService.leaveSession(sessionId, userId);
        }

        const sessionSockets = socketsBySession.get(sessionId);
        sessionSockets?.delete(userId);

        if (sessionSockets?.size === 0) {
            socketsBySession.delete(sessionId);
        }

        gameSessionRooms.broadcast(io, {
            sessionId,
            eventName: "game:player-left",
            data: { playerId: userId }
        });
    });
};