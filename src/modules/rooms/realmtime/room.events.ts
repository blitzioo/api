import { ZodError } from "zod";
import { IEventParams, SocketData } from "../../../realtime/types.js";
import GameSessionService from "../../game-sessions/game-session.service.js";
import GamesRepository from "../../games/core/games.repository.js";
import BaseGame from "../../games/core/games/base-game.js";
import { RoomOptions } from "../room.types.js";
import roomEventsUtils from "./room-events.utils.js";
import GamesOptionsParser from "../../games/core/options/options.parser.js";

const gameSession = new GameSessionService();
const gameRepository = new GamesRepository();

export const registerRoomEvents = async ({ socket, io }: IEventParams) => {
    const data = socket.data as SocketData;
    const roomCode = data.roomCode;

    socket.on("room:start", async ({ options: selectedOptions }: RoomOptions) => {
        try {
            const room = await gameSession.findByCode(roomCode);

            if (!room) {
                socket.emit("room:error", { error: "Room not found" });
                return;
            }

            if (room.hostId !== data.user.id) {
                socket.emit("room:error", { error: "You are not the host" });
                return;
            }

            const game = gameRepository.findById(room.gameId);

            if (!game) {
                socket.emit("room:error", { error: "Game not found" });
                return;
            }

            const gameParser = GamesOptionsParser.parse(game.options);
            const parsedOptions = gameParser.parse(selectedOptions ?? {});

            roomEventsUtils.broadcast(io, {
                roomCode,
                eventName: "room:started"
            });

            await BaseGame.loadById(
                room.gameId,
                roomCode,
                {
                    roomCode,
                    players: room.players,
                    state: room.state,
                    options: parsedOptions,
                    io
                }
            );
        } catch (error) {
            if (error instanceof ZodError) {
                socket.emit("room:error", {
                    error: "Invalid game options",
                    issues: error.issues
                });
                return;
            }

            socket.emit("room:error", {
                error: error instanceof Error ? error.message : "Failed to start room"
            });
        }
    });

}