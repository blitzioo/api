import { GameEnum } from "../games/game.enum.js";
import { RoomPlayer } from "../rooms/room.types.js";

export enum GameSessionStatus {
    RUNNING = "running",
    ENDED = "ended"
}

export type GameSessionEntity = {
    id: string;
    roomCode: string;
    hostId: string;
    status: string;
    gameId: GameEnum;
    state: GameSessionState;
    startedAt: Date;
    endedAt: Date | null;
    playersSnapshot: RoomPlayer[];
    createdAt: Date;
    updatedAt: Date;
};

export type GameSessionPlayerSnapshot = {
    id: string;
    username: string;
    isHost: boolean;
    isReady: boolean;
};

export type GameSessionState = Record<string, unknown>;

export type CreateGameSessionParams = {
    roomCode: string;
    gameId: GameEnum;
    hostId: string;
    state?: GameSessionState;
    playersSnapshot: RoomPlayer[];
};