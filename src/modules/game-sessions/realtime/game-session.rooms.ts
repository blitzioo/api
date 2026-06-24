import { IEventParams } from "../../../realtime/types.js";

const getRoomName = (gameSessionId: string) =>
    `game:${gameSessionId}`;

const broadcast = (io: IEventParams["io"], {
    sessionId,
    eventName,
    data
}: {
    sessionId: string;
    eventName: string;
    data?: any;
}) => {
    io
        .to(getRoomName(sessionId))
        .emit(eventName, data);
}

export default {
    getRoomName,
    broadcast
}