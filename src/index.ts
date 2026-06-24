import "./core/env.js";

import Fastify from "fastify";
import cors from "@fastify/cors";

import { initDatabase } from "./database/sequezlie.js";
import { registerWebsocket } from "./realtime/socket.js";

import registerModules from "./modules/register-modules.js";
import logger from "./core/logger.js";

await initDatabase();

const fastify = Fastify({
    logger: process.env.NODE_ENV === "development"
});

fastify.setErrorHandler((error: Error, _, reply) => {
    const statusCode =
        "statusCode" in error && typeof error.statusCode === "number"
            ? error.statusCode
            : 500;

    return reply.code(statusCode).send({
        error: error.message
    });
});

await fastify.register(cors, {
    origin: process.env.APP_ORIGIN || "*",
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS']
});

await registerWebsocket(fastify);

fastify.get("/health", async () => {
    return { ok: true };
});

await registerModules(fastify);

const port = Number(process.env.APP_PORT) || 3000;

await fastify.listen({
    host: "0.0.0.0",
    port
});

logger.info(`Server listening on: http://localhost:${port}`);