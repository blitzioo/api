import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";
import { AuthUser } from "../modules/user/user.types.js";
import { RoomSockets } from "./socket-registry.js";
import { Room } from "../modules/rooms/room.types.js";

export type AppServer = Server;
export type AppSocket = Socket;

export interface BaseRegisterOptions {
  io: AppServer;
  socket: AppSocket;
}

export interface BaseHandlerContext {
  room: Room;
  io: AppServer;
  socket: AppSocket;
  user: AuthUser;
}

export interface IEventParams extends BaseRegisterOptions {
  fastify: FastifyInstance;
  sockets: RoomSockets;
} 
export type TEventFunction = (event: IEventParams) => Promise<void>|void;

export interface SocketData {    
  user: AuthUser;
  roomCode: string;
}