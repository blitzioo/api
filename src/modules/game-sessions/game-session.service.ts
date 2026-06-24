import HttpError from "../../core/errors/http-error.js";
import GameSessionRepository from "./game-session.repository.js";
import { GameSessionEntity, GameSessionState, GameSessionStatus } from "./game-session.types.js";

export default class GameSessionService {

    private readonly gameSessionRepository = new GameSessionRepository();

    public async findById(id: string) {
        return this.gameSessionRepository.findById(id);
    }

    public async findByCode(code: string) {
        return this.gameSessionRepository.findRunningByRoomCode(code);
    }

    public async updateState(
        id: string,
        newState: GameSessionState 
    ) {
        await this.gameSessionRepository.updateState(id, newState);
    }

    public async endSession(sessionId: string) {
        await this.gameSessionRepository.end(sessionId);
    }

    public async leaveSession(
        sessionId: string,
        playerId: string
    ): Promise<GameSessionEntity> {
        const session = await this.gameSessionRepository.findById(sessionId);

        if (!session) {
            throw new HttpError("Game session not found", 404);
        }

        if (session.status !== GameSessionStatus.RUNNING) {
            throw new HttpError("Game session is not running", 409);
        }

        const players = session.playersSnapshot.filter(
            (player) => player.id !== playerId
        );

        const updatedState = {
            ...session.state,
            players
        };

        if (players.length === 0) {
            await this.gameSessionRepository.end(session.id);

            return {
                ...session,
                status: GameSessionStatus.ENDED,
                endedAt: new Date(),
                state: updatedState,
                playersSnapshot: players
            };
        }

        return this.gameSessionRepository.updatePlayersSnapshot(
            session.id,
            players
        );
    }

}