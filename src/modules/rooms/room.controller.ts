import { FastifyReply, FastifyRequest } from "fastify";
import { GameEnum } from "../games/core/games/game.enum.js";
import RoomService from "./room.service.js";
import { ZodError } from "zod";

const roomService = new RoomService();

export const createRoom = async (
    request: FastifyRequest<{
        Body: {
            gameId: GameEnum;
        }
    }>,
    reply: FastifyReply
) => {
    try {
        const { gameId } = request.body;
        const { id: hostId, username } = request.user!;

        const room = await roomService.createRoom(
            hostId,
            username,
            gameId
        );

        return reply.code(201).send({
            room
        });

    } catch (e) {
        if (e instanceof ZodError) {
            return reply.code(400).send({
                error: "Invalid game options",
                details: e.issues
            });
        }

        return reply.code(500).send({
            error: e instanceof Error
                ? e.message
                : "Internal server error"
        });
    }
}

export const getRoomByCode = async (
    request: FastifyRequest<{
        Params: {
            code: string;
        }
    }>, 
    reply: FastifyReply
) => {
    try {
        const { code } = request.params;
        const room = await roomService.getRoom(code);
        reply.code(200).send({room});
    } catch(e) {
        reply.send({error: e})
    }
}

export const joinRoom = async (
    request: FastifyRequest<{
        Params: {
            code: string;
        }
    }>,
    reply: FastifyReply
) => {
    try {
        const { id, username } = request.user!;
        const { code } = request.params as { code: string };

        const room = await roomService.joinRoom(code, {
            id,
            username
        });

        return reply.send({ room });
    } catch(e) {
        return reply.send({error: e});
    }
}

export const leaveRoom = async (
    request: FastifyRequest<{
        Params: {
            code: string;
        }
    }>,
    reply: FastifyReply
) => {
    try {
        const { id: playerId } = request.user!;
        const { code } = request.params as { code: string };

        const room = await roomService.leaveRoom(code, playerId);

        return reply.send({ room });
    } catch(e) {
        return reply.send({error: e})
    }
}