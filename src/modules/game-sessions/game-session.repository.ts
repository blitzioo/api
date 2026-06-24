import { RoomPlayer } from "../rooms/room.types.js";
import { toGameSessionEntity } from "./game-session.mapper.js";
import GameSession from "./game-session.model.js";
import {
    CreateGameSessionParams,
    GameSessionStatus,
    GameSessionState,
    GameSessionEntity
} from "./game-session.types.js";

export default class GameSessionRepository {
    public async create(params: CreateGameSessionParams): Promise<GameSession> {
        return GameSession.create({
            roomCode: params.roomCode,
            gameId: params.gameId,
            hostId: params.hostId,
            state: params.state ?? {},
            playersSnapshot: params.playersSnapshot,
            status: GameSessionStatus.RUNNING
        });
    }

    public async findById(id: string): Promise<GameSessionEntity | null> {
        const session = await GameSession.findByPk(id);

        if (!session) {
            return null;
        }

        return toGameSessionEntity(session);
    }

    public async findRunningByRoomCode(roomCode: string): Promise<GameSessionEntity | null> {
        const session = await GameSession.findOne({
            where: {
                roomCode,
                status: GameSessionStatus.RUNNING
            }
        });

        return session ? toGameSessionEntity(session) : null;
    }

    public async findAllByRoomCode(roomCode: string): Promise<GameSession[]> {
        return GameSession.findAll({
            where: {
                roomCode
            },
            order: [["createdAt", "DESC"]]
        });
    }

    public async updateState(
        id: string,
        state: GameSessionState
    ): Promise<void> {
        await GameSession.update(
            { state },
            { where: { id } }
        );
    }

    public async end(id: string): Promise<void> {
        await GameSession.update(
            {
                status: GameSessionStatus.ENDED,
                endedAt: new Date()
            },
            {
                where: { id }
            }
        );
    }

    public async updatePlayersSnapshot(
        id: string,
        playersSnapshot: RoomPlayer[]
    ): Promise<GameSessionEntity> {
        const session = await GameSession.findByPk(id);

        if (!session) {
            throw new Error("Game session not found");
        }

        session.playersSnapshot = playersSnapshot;

        await session.save();

        return toGameSessionEntity(session);
    }
}