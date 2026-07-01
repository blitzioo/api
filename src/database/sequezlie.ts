import { Sequelize } from "sequelize";
import { initializeModels } from "./initModels.js";
import logger from "../core/logger.js";

export const sequelize = new Sequelize({
  dialect: "mysql",
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT ?? 3306),
  database: process.env.DB_NAME,
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  logging: false,
});

export const initDatabase = async () => {
    initializeModels(sequelize);
    await sequelize.sync();

    logger.info('Connected to database');
}