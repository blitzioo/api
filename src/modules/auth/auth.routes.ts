import { FastifyInstance } from "fastify";
import jwtService from "./jwt.service.js";
import UserService from "../user/user.service.js";

const userService = new UserService();

export default (app: FastifyInstance) => {

    app.post("/guest", {
        schema: {
            body: {
                type: "object",
                required: ["username"],
                additionalProperties: false,
                properties: {
                    username: {
                        type: "string",
                        minLength: 2,
                        maxLength: 32,
                    }
                }
            }
        }
    }, async (request, reply) => {
        const {username} = request.body as { username: string };
        const token = await userService.createAsGuest(username);
        return reply.send({token});
    });

}