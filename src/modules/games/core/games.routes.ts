import { FastifyInstance } from "fastify";
import { getGames } from "./games.controller.js";

export default (app: FastifyInstance) => {

    app.get("/", getGames);

}