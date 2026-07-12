import { Server } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";

import pubClient from "../core/redis.js";
import { SocketData } from "./types.js";

export const configureRedisAdapter = async (
  io: Server<{}, {}, {}, SocketData>
): Promise<void> => {
  const subClient = pubClient.duplicate();

  if (!pubClient.isOpen) {
    await pubClient.connect();
  }

  if (!subClient.isOpen) {
    await subClient.connect();
  }

  io.adapter(createAdapter(pubClient, subClient));
};