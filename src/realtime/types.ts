import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";
import { AuthUser } from "../modules/user/user.types.js";
import { RoomSockets } from "./socket-registry.js";

export interface IEventParams {
  socket: Socket;
  fastify: FastifyInstance;
  io: Server;
  sockets: RoomSockets;
} 
export type TEventFunction = (event: IEventParams) => Promise<void>|void;

export interface SocketData {    
  user: AuthUser;
  roomCode: string;
}