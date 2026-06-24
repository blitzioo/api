import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { FastifyInstance } from "fastify";

import pubClient from "../core/redis.js";
import events from "./events.js";

import logger from "../core/logger.js";
import { SocketData } from "./types.js";
import socketHook from "./socket.hook.js";

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
  io.on("connection", (socket) => {
    const { user, gameSession } = socket.data;

    logger.info(`socket connected ${socket.id}`, { 
      username: user.username,
      id: user.id,
      gameSessionId: gameSession.id
    });

    events.registerAll({ socket, io, fastify });
  });

  //fastify.decorate("io", io);
}