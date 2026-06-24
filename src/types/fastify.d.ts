import "fastify";
import { AuthUser } from "../modules/user/user.types.ts";

declare module "fastify" {
  interface FastifyRequest {
    user: AuthUser | null;
  }
}