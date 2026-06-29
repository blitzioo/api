import { Socket } from "socket.io";
import jwtService from "../modules/auth/jwt.service.js";
import UserService from "../modules/user/user.service.js";

const userService = new UserService();

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

    const user = await userService.findById(payload.id);
    if(!user) {
      return next(new Error("User not found"));
    }

    socket.data.user = user;
    socket.data.roomCode = roomCode;

    next();
  }