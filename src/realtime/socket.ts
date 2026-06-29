import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { FastifyInstance } from "fastify";

import pubClient from "../core/redis.js";
import events from "./events.js";

import logger from "../core/logger.js";
import { SocketData } from "./types.js";
import socketHook from "./socket.hook.js";
import {RoomSockets} from "./socket-registry.js";
import RoomService from "../modules/rooms/room.service.js";
import roomEventsUtils from "../modules/rooms/realmtime/room-events.utils.js";

const roomService = new RoomService();

export const registerWebsocket = async (fastify: FastifyInstance) => {
  const io = new Server<{}, {}, {}, SocketData>(fastify.server, {
    cors: {
      origin: process.env.APP_ORIGIN || "*",
    }
  });

  const subClient = pubClient.duplicate();

  await pubClient.connect();
  await subClient.connect();

  io.adapter(createAdapter(pubClient, subClient));

  io.use(socketHook);
  io.on("connection", async (socket) => {
    const { user, roomCode } = socket.data;

    logger.info(`socket connected ${socket.id}`, { 
      username: user.username,
      id: user.id,
      roomCode
    });
    const userId = user.id;
    const room = await roomService.getRoom(roomCode);

    const roomSockets = RoomSockets.from(roomCode);
    roomSockets.register(userId, socket);

    // un peu gettho
    roomEventsUtils.broadcast(io, {
      roomCode,
      eventName: "room:player-join",
      data: { 
        players: room?.players ?? [],
        username: user.username
      }
    })

    events.registerAll({ 
      socket, 
      io, 
      fastify,
      sockets: roomSockets
    });

    socket.on("disconnect", async () => {
        const currentSocket = roomSockets.getSocket(userId);
        if(currentSocket?.id === socket.id) {
            roomSockets.unregister(userId);
        }

        if (roomSockets.isEmpty()) {
            roomSockets.flush();
        }

        const playerList = room?.players ?? [];
        const idx = playerList.findIndex(p => p.id === user.id);
        if(idx !== -1) {
          playerList.splice(idx, 1);
        }

        roomEventsUtils.broadcast(io, {
            roomCode,
            eventName: "room:player-left",
            data: { 
              players: playerList,
              username: user.username
            }
        });
    });
  });
}