import { registerGameSessionEvents } from "../modules/game-sessions/realtime/game-session.events.js";
import { IEventParams } from "./types.js";

export default {
    registerAll(params: IEventParams) {
        registerGameSessionEvents(params);
    }
};