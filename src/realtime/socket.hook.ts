import { Socket } from "socket.io";
import jwtService from "../modules/auth/jwt.service.js";
import UserService from "../modules/user/user.service.js";
import GameSessionService from "../modules/game-sessions/game-session.service.js";

const userService = new UserService();
const gameSessionService = new GameSessionService();

export default async (socket: Socket, next: any) => {
    const { token, roomCode } = socket.handshake.auth as {
      token?: string;
      roomCode?: string;
    };

    if (!token) {
      return next(new Error("Missing token"));
    }

    if (!roomCode) {
      return next(new Error("Missing room code"));
    }

    const payload = jwtService.decode(token);

    if (!payload) {
      return next(new Error("Invalid token"));
    }

    const gameSession = await gameSessionService.findByCode(roomCode);
    if (!gameSession) {
        return next(new Error("Room not found"));
    }
    const user = await userService.findById(payload.id);
    if(!user) {
      return next(new Error("User not found"));
    }

    socket.data.user = user;
    socket.data.gameSession = gameSession;

    next();
  }