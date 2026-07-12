import { FastifyInstance } from "fastify";
import { BaseRegisterOptions } from "../types.js";
import RoomService from "../../modules/rooms/room.service.js";
import logger from "../../core/logger.js";
import { RoomSockets } from "../socket-registry.js";
import { handleRoomConnectionHandler } from "../../modules/rooms/realmtime/room-presence.events.js";
import { handleGameSessionConnectionHandler } from "../../modules/game-sessions/realtime/game-session-presence.events.js";
import { RoomStatus } from "../../modules/rooms/room.types.js";
import { registerDisconnectHandler } from "./socket-disconnect.js";
import socketEvents from "./socket-events.js";

interface RegisterConnectionHandlerOptions extends BaseRegisterOptions {
  fastify: FastifyInstance;
} 

const roomService = new RoomService();

export const handleSocketConnection = async ({
  io,
  socket,
  fastify,
}: RegisterConnectionHandlerOptions): Promise<void> => {
  const { user, roomCode } = socket.data;
  const userId = user.id;

  logger.info(`socket connected ${socket.id}`, {
    username: user.username,
    id: userId,
    roomCode,
  });

  try {
    const room = await roomService.getRoom(roomCode);
    const roomSockets = RoomSockets.from(roomCode);

    if(!room) {
      logger.error("Room not found");
      socket.disconnect(true);
    }

    roomSockets.register(userId, socket);

    socketEvents.registerAll({
      socket,
      io,
      fastify,
      sockets: roomSockets,
    });

    const context = {io, room: room!, user, socket};
    switch(room!.status) {
      case RoomStatus.WAITING:
        await handleRoomConnectionHandler(context);
        break;
      case RoomStatus.PLAYING:
        await handleGameSessionConnectionHandler(context);
        break;
    }

    registerDisconnectHandler({
      io,
      socket,
      roomSockets,
      roomService,
    });
  } catch (error) {
    logger.error(error);

    socket.disconnect(true);
  }
};