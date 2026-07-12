import { IEventParams } from "../types.js";

export const resolveSessionRoom = (roomCode: string): string => {
  return `session:${roomCode}`;
};

interface BroadcastOptions<TData> {
  roomCode: string;
  eventName: string;
  data?: TData;
}

export const broadcastToRoom = <TData>(
  io: IEventParams["io"],
  {
    roomCode,
    eventName,
    data,
  }: BroadcastOptions<TData>
): void => {
  io
    .to(resolveSessionRoom(roomCode))
    .emit(eventName, data);
};