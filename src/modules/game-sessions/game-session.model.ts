import {
    CreationOptional,
    DataTypes,
    InferAttributes,
    InferCreationAttributes,
    Model,
    Sequelize
} from "sequelize";

import { GameEnum } from "../games/game.enum.js";
import { GameSessionStatus } from "./game-session.types.js";

export default class GameSession extends Model<
    InferAttributes<GameSession>,
    InferCreationAttributes<GameSession>
> {
    declare id: CreationOptional<string>;

    declare roomCode: string;

    declare gameId: GameEnum;

    declare hostId: string;

    declare status: CreationOptional<GameSessionStatus>;

    declare state: CreationOptional<object>;

    declare startedAt: CreationOptional<Date>;

    declare playersSnapshot: object[];

    declare endedAt: CreationOptional<Date | null>;

    declare createdAt: CreationOptional<Date>;

    declare updatedAt: CreationOptional<Date>;

    public static initialize(sequelize: Sequelize) {
        GameSession.init(
            {
                id: {
                    type: DataTypes.UUID,
                    defaultValue: DataTypes.UUIDV4,
                    primaryKey: true
                },
                roomCode: {
                    type: DataTypes.STRING(6),
                    allowNull: false
                },
                gameId: {
                    type: DataTypes.ENUM(...Object.values(GameEnum)),
                    allowNull: false
                },
                hostId: {
                    type: DataTypes.UUID,
                    allowNull: false
                },
                status: {
                    type: DataTypes.ENUM(
                        GameSessionStatus.RUNNING,
                        GameSessionStatus.ENDED
                    ),
                    allowNull: false,
                    defaultValue: GameSessionStatus.RUNNING
                },
                playersSnapshot: {
                    type: DataTypes.JSON,
                    allowNull: false,
                    defaultValue: []
                },
                state: {
                    type: DataTypes.JSON,
                    allowNull: false,
                    defaultValue: {}
                },
                startedAt: {
                    type: DataTypes.DATE,
                    allowNull: false,
                    defaultValue: DataTypes.NOW
                },
                endedAt: {
                    type: DataTypes.DATE,
                    allowNull: true
                },
                createdAt: DataTypes.DATE,
                updatedAt: DataTypes.DATE
            },
            {
                sequelize,
                tableName: "game_sessions",
                modelName: "GameSession",
                timestamps: true,
                indexes: [
                    {
                        fields: ["roomCode"]
                    },
                    {
                        fields: ["status"]
                    }
                ]
            }
        );
    }
}