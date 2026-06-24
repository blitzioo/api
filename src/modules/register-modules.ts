import { FastifyInstance } from "fastify";

import authRoutes from "./auth/auth.routes.js";
import roomsRoutes from "./rooms/room.routes.js";

const routes: {route: any, prefix: string}[] = [
    { route: authRoutes, prefix: "/auth" },
    { route: roomsRoutes, prefix: "/rooms" },
]

const registerModules = async (app: FastifyInstance) => {
    routes.forEach(({route, prefix}) => {
        app.register(route, { prefix });
    })
}

export default registerModules;