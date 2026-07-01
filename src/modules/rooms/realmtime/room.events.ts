import { IEventParams, SocketData } from "../../../realtime/types.js";
import GameSessionService from "../../game-sessions/game-session.service.js";
import BaseGame from "../../games/base-game.js";
import roomEventsUtils from "./room-events.utils.js";

const gameSession = new GameSessionService();
export const registerRoomEvents = async ({ socket, io }: IEventParams) => {
    const data = socket.data as SocketData;
    const roomCode = data.roomCode;

    socket.on("room:start", async () => {
        const room = await gameSession.findByCode(roomCode);
        if(!room) {
            socket.emit("room:error", "Room not found");
        }
        if(room!.hostId !== data.user.id) {
            socket.emit("room:error", "You are not the host");
        }
        roomEventsUtils.broadcast(io, {
            roomCode,
            eventName: "room:started"
        });

        const gameInstance = await BaseGame.loadById(
            room!.gameId,
            roomCode,
            {
                roomCode,
                players: room!.players,
                state: room!.state,
                options: room!.options,
                io
            }
        );
        await gameInstance!.initialize();
    })

}