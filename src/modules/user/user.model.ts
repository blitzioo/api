import {
  DataTypes,
  Model,
  Sequelize,
  InferAttributes,
  InferCreationAttributes,
  CreationOptional,
} from "sequelize";

export default class User extends Model<
  InferAttributes<User>,
  InferCreationAttributes<User>
> {

  declare id: CreationOptional<string>;
  declare username: string;
  declare lastSeenAt: CreationOptional<Date>;
  declare createdAt: CreationOptional<Date>;

  static initialize(sequelize: Sequelize) {
    User.init(
      {
        id: {
          type: DataTypes.UUID,
          defaultValue: DataTypes.UUIDV4,
          primaryKey: true,
        },
        username: {
          type: DataTypes.STRING(32),
          allowNull: false,
        },
        lastSeenAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW,
        },
        createdAt: {
          type: DataTypes.DATE,
          allowNull: false,
          defaultValue: DataTypes.NOW
        },
      },
      {
        sequelize,
        tableName: "users",
        modelName: "User",
        timestamps: true,
      }
    );
  }
}