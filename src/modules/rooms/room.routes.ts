import { FastifyInstance } from "fastify";
import { authHook } from "../auth/auth.hook.js";
import { createRoom, getRoomByCode, joinRoom, leaveRoom } from "./room.controller.js"

export default (app: FastifyInstance) => {
    app.addHook("preHandler", authHook);

    app.post("/", {
        schema: {
            body: {
                type: "object",
                required: ["gameId"],
            }
        }
    }, createRoom);

    app.get("/:code", {
        schema: {
            params: {
                type: "object",
                required: ["code"],
                additionalProperties: false,
                properties: {
                    code: {
                        type: "string",
                        minLength: 6,
                        maxLength: 6
                    }
                }
            }
        }
    }, getRoomByCode);

    app.patch("/:code/join", {
        schema: {
            params: {
                type: "object",
                required: ["code"],
                additionalProperties: false,
                properties: {
                    code: {
                        type: "string",
                        minLength: 6,
                        maxLength: 6
                    }
                }
            }
        }
    }, joinRoom);

    app.patch("/:code/leave", {
        schema: {
            params: {
                type: "object",
                required: ["code"],
                additionalProperties: false,
                properties: {
                    code: {
                        type: "string",
                        minLength: 6,
                        maxLength: 6
                    }
                }
            }
        }
    }, leaveRoom);
}