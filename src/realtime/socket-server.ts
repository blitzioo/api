import { Server } from "socket.io";
import { FastifyInstance } from "fastify";

import socketHook from "./socket-hook.js";
import { SocketData } from "./types.js";
import { configureRedisAdapter } from "./socket-adapter.js";
import { handleSocketConnection } from "./events/socket-connection.js";

export const registerWebsocket = async (
  fastify: FastifyInstance
): Promise<void> => {
  const io = new Server<{}, {}, {}, SocketData>(fastify.server, {
    cors: {
      origin: process.env.APP_ORIGIN ?? "*",
    },
  });

  await configureRedisAdapter(io);

  io.use(socketHook);

  io.on("connection", (socket) => {
    void handleSocketConnection({
      io,
      socket,
      fastify
    });
  });
};