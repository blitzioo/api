import { createClient } from "redis";
import logger from "./logger.js";

const client = createClient({
    url: process.env.REDIS_URL
});

client.on("ready", () => {
    logger.info('Connected to redis');
})

client.on("error", error => {
    logger.error('Failed to connect to redis', error);
})

export default client;