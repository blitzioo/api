import { IEventParams, SocketData } from "../../../realtime/types.js";
import GameSessionService from "../game-session.service.js";
import BaseGame from "../../games/base-game.js";

const gameSessionService = new GameSessionService();

export const registerGameSessionEvents = async ({ socket }: IEventParams) => {
    const data = socket.data as SocketData;

    const userId = data.user.id!;
    const roomCode = data.roomCode;
    const room = await gameSessionService.findByCode(roomCode);
    if(!room) {
        socket.emit("session:error", {
            error: 'Cannot find room with code: ' + roomCode
        });
        return;
    }
    socket.emit("session:infos", {
        gameId: room.gameId
    });

    const gameInstance = await BaseGame.loadById(room.gameId, room.code);
    if(gameInstance) {
        await gameInstance.syncPlayer(userId);
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

            await gameInstance.handleAction(
                userId,
                action,
                payload ?? {}
            );
        } catch (e) {
            const error = e as Error;

            socket.emit("session:error", {
                error: error.message
            });
        }
    });
};