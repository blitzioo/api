import { FastifyReply, FastifyRequest } from "fastify";
import GamesRepository from "./games.repository.js";

const gamesRepository = new GamesRepository();

export const getGames = async (
  _: FastifyRequest,
  reply: FastifyReply
) => {
    return reply.send({
        games: gamesRepository.findAll()
    });
};