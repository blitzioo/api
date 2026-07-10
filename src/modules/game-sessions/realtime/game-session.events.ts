import { IEventParams, SocketData } from "../../../realtime/types.js";
import GameSessionService from "../game-session.service.js";
import BaseGame from "../../games/core/games/base-game.js";

const gameSessionService = new GameSessionService();

export const registerGameSessionEvents = async ({ socket }: IEventParams) => {
    const data = socket.data as SocketData;

    // TODO: manage when player is leaving
    const userId = data.user.id!;
    const roomCode = data.roomCode;
    const room = await gameSessionService.findByCode(roomCode);
    if(!room) {
        socket.emit("session:error", {
            error: 'Cannot find room with code: ' + roomCode,
            code: "ROOM_NOT_FOUND"
        });
        return;
    }

    if(!room.players.find(p => p.id === userId)) {
        socket.emit("session:error", {
            erorr: "You are not in this game",
            code: "PLAYER_NOT_ALLOWED"
        })
    }

    socket.emit("session:infos", {
        gameId: room.gameId
    });

    const gameInstance = await BaseGame.loadById(room.gameId, room.code);
    if(gameInstance) {
        await gameInstance.syncPlayer(userId);
    } else {
        socket.emit("session:error", {
            error: "Game not found",
            code: "GAME_NOT_FOUND"
        })
    }
    
    socket.removeAllListeners("game:action");

    socket.on("game:action", async ({ action, payload }) => {
        try {
            if (!action) {
                throw new Error("Missing action");
            }
            const gameInstance = await BaseGame.loadById(
                room.gameId, 
                room.code
            );
            if(!gameInstance) {
                throw new Error("Missing game instance");
            }

            await gameInstance.handleAction({
                playerId: userId,
                action: action,
                data: payload ?? {}
            });
        } catch (e) {
            const error = e as Error;

            socket.emit("session:error", {
                error: error.message
            });
        }
    });
};