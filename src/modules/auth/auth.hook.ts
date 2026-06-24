import { FastifyReply, FastifyRequest } from "fastify";
import jwtService from "./jwt.service.js";
import UserService from "../user/user.service.js";

const userService = new UserService();

export async function authHook(
  request: FastifyRequest,
  reply: FastifyReply
) {
  const authorization = request.headers.authorization;

  if (!authorization?.startsWith("Bearer ")) {
    return reply.code(401).send({ message: "Missing token." });
  }

  const token = authorization.replace("Bearer ", "");
  const payload = jwtService.decode(token);

  if (!payload) {
    return reply.code(401).send({ message: "Invalid token." });
  }

  const user = await userService.findById(payload.id);
  if(!user) {
    return reply.code(401).send({ message: "User not found." });
  }
  request.user = user;
}