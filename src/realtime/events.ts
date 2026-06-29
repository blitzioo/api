import { registerGameSessionEvents } from "../modules/game-sessions/realtime/game-session.events.js";
import { registerRoomEvents } from "../modules/rooms/realmtime/room.events.js";
import { IEventParams } from "./types.js";

export default {
    registerAll(params: IEventParams) {
        registerGameSessionEvents(params);
        registerRoomEvents(params);
    }
};