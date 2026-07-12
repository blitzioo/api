import { BaseHandlerContext } from "../../../realtime/types.js";
import { broadcastToRoom } from "../../../realtime/utils/broadcast.js";
import BaseGame from "../../games/core/games/base-game.js";
import { PlayerStatus } from "../../rooms/room.types.js";
import GameSessionService from "../game-session.service.js";
import {
    clearDisconnectTimeout,
    scheduleDisconnectTimeout
} from "./disconnect-timeout.manager.js";

const gameSessionService = new GameSessionService();

const TIMEOUT_SECONDS = 30;

export const handleGameSessionConnectionHandler = async ({
    io,
    room,
    user,
    socket
}: BaseHandlerContext) => {
    const gameInstance = await BaseGame.loadById(
        room.gameId,
        room.code
    );

    if (!gameInstance) {
        socket.emit("session:error", {
            error: "Missing game instance"
        });
        return;
    }

    clearDisconnectTimeout(room.code, user.id);

    const updatedGameSession =
        await gameSessionService.markPlayerAsConnected(
            room.code,
            user.id
        );

    await gameInstance.updatePlayerConnectionStatus(
        user.id,
        PlayerStatus.CONNECTED
    );

    if (!updatedGameSession) {
        socket.emit("session:error", {
            error: "Missing game session"
        });
        return;
    }

    broadcastToRoom(io, {
        roomCode: room.code,
        eventName: "session:presence-changed",
        data: {
            players: updatedGameSession.players
        }
    });
};

export const handleGameSessionDisconnectHandler = async ({
    io,
    room,
    user
}: BaseHandlerContext) => {
    const gameInstance = await BaseGame.loadById(
        room.gameId,
        room.code
    );

    if (!gameInstance) {
        return;
    }

    const updatedGameSession =
        await gameSessionService.markPlayerAsDisconnected(
            room.code,
            user.id
        );

    await gameInstance.updatePlayerConnectionStatus(
        user.id,
        PlayerStatus.DISCONNECTED
    );

    if (!updatedGameSession) {
        return;
    }

    broadcastToRoom(io, {
        roomCode: room.code,
        eventName: "session:presence-changed",
        data: {
            players: updatedGameSession.players
        }
    });

    scheduleDisconnectTimeout(
        room.code,
        user.id,
        async () => {
            const currentSession =
                await gameSessionService.findByCode(room.code);

            if (!currentSession) {
                return;
            }

            const player = currentSession.players.find(
                (currentPlayer) => currentPlayer.id === user.id
            );

            if (!player) {
                return;
            }

            if (player.connectionStatus === PlayerStatus.CONNECTED) {
                return;
            }

            await gameSessionService.markPlayerAsTimeout(
                room.code,
                user.id
            );

            await gameInstance.handlePlayerTimeout(user.id);

            const sessionAfterTimeout =
                await gameSessionService.findByCode(room.code);

            if (!sessionAfterTimeout) {
                return;
            }

            broadcastToRoom(io, {
                roomCode: room.code,
                eventName: "session:player-timeout",
                data: {
                    players: sessionAfterTimeout.players,
                    player: {
                        id: user.id,
                        username: user.username
                    },
                    timeoutSeconds: TIMEOUT_SECONDS
                }
            });
        },
        TIMEOUT_SECONDS * 1_000
    );
};