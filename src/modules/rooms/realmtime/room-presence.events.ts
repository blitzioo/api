import { BaseHandlerContext } from "../../../realtime/types.js";
import { broadcastToRoom } from "../../../realtime/utils/broadcast.js";
import RoomService from "../room.service.js";

const roomService = new RoomService();

export const handleRoomConnectionHandler = async ({ io, room }: BaseHandlerContext) => {
    broadcastToRoom(io, {
      roomCode: room.code,
      eventName: "room:presence-changed",
      data: { players: room.players }
    });
}
export const handleRoomDisconnectHandler = async ({io, room, user}: BaseHandlerContext) => {
    const updatedRoom = await roomService.leaveRoom(room.code, user.id);
    broadcastToRoom(io, {
        roomCode: room.code,
        eventName: "room:presence-changed",
        data: { 
            players: updatedRoom.players,
            newHostId: updatedRoom.hostId
        }
    });
}