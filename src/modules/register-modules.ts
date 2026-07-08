import { FastifyInstance } from "fastify";

import authRoutes from "./auth/auth.routes.js";
import roomsRoutes from "./rooms/room.routes.js";
import gamesRoutes from "./games/core/games.routes.js";

const routes: {route: any, prefix: string}[] = [
    { route: authRoutes, prefix: "/auth" },
    { route: roomsRoutes, prefix: "/rooms" },
    { route: gamesRoutes, prefix: "/games" }
]

const registerModules = async (app: FastifyInstance) => {
    routes.forEach(({route, prefix}) => {
        app.register(route, { prefix });
    })
}

export default registerModules;