import { PlayerStatus, RoomStatus } from "../rooms/room.types.js";
import GameSessionRepository from "./game-session.repository.js";
import { GameSessionState } from "./game-session.types.js";

export default class GameSessionService {
  private readonly gameSessionRepository =
    new GameSessionRepository();

  public async findByCode(code: string) {
    return this.gameSessionRepository.findByCode(code);
  }

  public async updateState(
    code: string,
    newState: GameSessionState
  ) {
    return this.gameSessionRepository.updateState(
      code,
      newState
    );
  }

  public async markPlayerAsConnected(
    code: string,
    playerId: string
  ) {
    return this.gameSessionRepository.updatePlayerConnectionStatus(
      code,
      playerId,
      PlayerStatus.CONNECTED
    );
  }

  public async markPlayerAsDisconnected(
    code: string,
    playerId: string
  ) {
    return this.gameSessionRepository.updatePlayerConnectionStatus(
      code,
      playerId,
      PlayerStatus.DISCONNECTED
    );
  }

  public async markPlayerAsTimeout(
    code: string,
    playerId: string
  ) {
    return this.gameSessionRepository.updatePlayerConnectionStatus(
      code,
      playerId,
      PlayerStatus.TIMEOUT
    );
  }

  public async endSession(code: string) {
    return this.gameSessionRepository.update(code, {
      status: RoomStatus.CLOSED,
      endedAt: new Date(),
    });
  }
}