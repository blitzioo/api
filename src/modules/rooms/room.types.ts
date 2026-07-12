import { GameEnum } from "../games/core/games/game.enum.js";

export enum RoomStatus {
    WAITING = "waiting",
    PLAYING = "playing",
    CLOSED = "closed"
}
export enum PlayerStatus {
    CONNECTED = "CONNECTED",
    DISCONNECTED = "DISCONNECTED",
    TIMEOUT = "TIMEOUT"
}

export type RoomOptions = Record<string, unknown>;

export interface PublicRoomPlayer {
    id: string;
    username: string;
}
export interface RoomPlayer extends PublicRoomPlayer {
    connectionStatus: PlayerStatus;
    disconnectedAt?: Date;
}
export interface Room {
    code: string;
    hostId: string;
    gameId: GameEnum;
    status: RoomStatus;
    players: RoomPlayer[];
    createdAt: Date;
    options: RoomOptions;
}