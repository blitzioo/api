import { Room } from "../rooms/room.types.js";


export type GameSessionState = Record<string, unknown>;
export interface GameSession extends Room {
    state: GameSessionState;
    startedAt?: Date;
    endedAt?: Date;
}
