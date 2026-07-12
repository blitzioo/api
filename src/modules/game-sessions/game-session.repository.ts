import redis from "../../core/redis.js";
import RoomRepository from "../rooms/room.repository.js";
import { PlayerStatus, RoomStatus } from "../rooms/room.types.js";
import {
  GameSession,
} from "./game-session.types.js";

type GameSessionUpdate = Partial<GameSession>;

export default class GameSessionRepository {
  public async findByCode(code: string): Promise<GameSession | null> {
    const raw = await redis.get(RoomRepository.getRoomKey(code));

    if (!raw) {
      return null;
    }

    const data = JSON.parse(raw);

    return {
      ...data,
      state: data.state ?? {},
      startedAt: data.startedAt ?? undefined,
      endedAt: data.endedAt ?? undefined,
    } as GameSession;
  }

  public async update(
    code: string,
    patch: GameSessionUpdate
  ): Promise<GameSession | null> {
    const session = await this.findByCode(code);

    if (!session) {
      return null;
    }

    const updated: GameSession = {
      ...session,
      ...patch,
    };

    await redis.set(
      RoomRepository.getRoomKey(code),
      JSON.stringify(updated),
      {
        EX: RoomRepository.ROOM_TTL_SECONDS,
      }
    );

    return updated;
  }

  public async updateStatus(
    code: string,
    status: RoomStatus
  ): Promise<GameSession | null> {
    return this.update(code, { status });
  }

  public async updateState(
    code: string,
    state: GameSession["state"]
  ): Promise<GameSession | null> {
    return this.update(code, { state });
  }

  public async updatePlayerConnectionStatus(
    code: string,
    playerId: string,
    connectionStatus: PlayerStatus
  ): Promise<GameSession | null> {
    const session = await this.findByCode(code);

    if (!session) {
      return null;
    }

    const playerExists = session.players.some(
      (player) => player.id === playerId
    );

    if (!playerExists) {
      return null;
    }

    const players = session.players.map((player) =>
      player.id === playerId
        ? {
            ...player,
            connectionStatus,
          }
        : player
    );

    return this.update(code, { players });
  }
}