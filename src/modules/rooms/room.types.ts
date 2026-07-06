import { GameEnum } from "../games/game.enum.js";

export enum RoomStatus {
    WAITING = "waiting",
    PLAYING = "playing",
    CLOSED = "closed"
}
export type RoomOptions = Record<string, unknown>;

export interface RoomPlayer extends PublicRoomPlayer {
    isHost: boolean;
    isReady: boolean;
}
export interface PublicRoomPlayer {
    id: string;
    username: string;
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