import { FastifyInstance } from "fastify";
import { Server, Socket } from "socket.io";
import { AuthUser } from "../modules/user/user.types.js";
import { GameSessionEntity } from "../modules/game-sessions/game-session.types.js";

export interface IEventParams {
    socket: Socket;
    fastify: FastifyInstance;
    io: Server;
} 
export type TEventFunction = (event: IEventParams) => Promise<void>|void;

export interface SocketData {    
  user: AuthUser;
  gameSession: GameSessionEntity;
}