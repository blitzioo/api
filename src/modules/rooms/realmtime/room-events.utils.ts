import { IEventParams } from "../../../realtime/types.js";

const resolveTag = (code: string) => {
    return `session:${code}`;
}

const broadcast = (io: IEventParams["io"], {
    roomCode,
    eventName,
    data
}: {
    roomCode: string;
    eventName: string;
    data?: any;
}) => {
    io
        .to(resolveTag(roomCode))
        .emit(eventName, data);
}

export default {
    resolveTag,
    broadcast
}