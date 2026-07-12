import logger from "../../core/logger.js";
import { handleGameSessionDisconnectHandler } from "../../modules/game-sessions/realtime/game-session-presence.events.js";
import { handleRoomDisconnectHandler } from "../../modules/rooms/realmtime/room-presence.events.js";
import RoomService from "../../modules/rooms/room.service.js";
import { RoomStatus } from "../../modules/rooms/room.types.js";
import { RoomSockets } from "../socket-registry.js";
import { BaseRegisterOptions } from "../types.js";

interface RegisterDisconnectHandlerOptions extends BaseRegisterOptions {
  roomSockets: RoomSockets;
  roomService: RoomService;
}

export const registerDisconnectHandler = ({
  io,
  socket,
  roomSockets,
  roomService,
}: RegisterDisconnectHandlerOptions): void => {
  socket.on("disconnect", async () => {
    const { user, roomCode } = socket.data;
    const userId = user.id;

    try {
      const currentSocket = roomSockets.getSocket(userId);

      if (currentSocket?.id !== socket.id) {
        return;
      }

      roomSockets.unregister(userId);

      if (roomSockets.isEmpty()) {
        roomSockets.flush();
      }

      const currentRoom = await roomService.getRoom(roomCode);

      if (!currentRoom || currentRoom.status === RoomStatus.CLOSED) {
        return;
      }

      const context = {io, room: currentRoom, user, socket};
      switch(currentRoom.status) {
        case RoomStatus.WAITING:
          await handleRoomDisconnectHandler(context);
          break;
        case RoomStatus.PLAYING:
          await handleGameSessionDisconnectHandler(context);
          break;
      }
    } catch (error) {
      logger.error(error);
    }
  });
};