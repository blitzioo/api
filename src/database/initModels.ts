import { Sequelize } from "sequelize";
import User from "../modules/user/user.model.js";
import GameSession from "../modules/game-sessions/game-session.model.js";
import logger from "../core/logger.js";

const models: any[] = [
  User,
  GameSession
];

export const initializeModels = (sequelize: Sequelize) => {
  models.forEach(model => model.initialize(sequelize));
  logger.info(`Initialized ${models.length} models`);
}