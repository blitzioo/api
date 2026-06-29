import { RoomStatus } from "../rooms/room.types.js";
import GameSessionRepository from "./game-session.repository.js";
import { GameSessionState } from "./game-session.types.js";

export default class GameSessionService {

    private readonly gameSessionRepository = new GameSessionRepository();

    public async findByCode(code: string) {
        return this.gameSessionRepository.findByCode(code);
    }

    public async updateState(
        code: string,
        newState: GameSessionState 
    ) {
        await this.gameSessionRepository.updateState(
            code,
            newState
        );
    }

    public async endSession(code: string) {
        await this.gameSessionRepository.update(code, {
            status: RoomStatus.CLOSED,
            endedAt: new Date()
        });
    }

}