import redis from "../../core/redis.js";
import { RoomStatus } from "../rooms/room.types.js";
import { GameSession } from "./game-session.types.js";

const ROOM_TTL_SECONDS = 60 * 60 * 24;

type GameSessionUpdate = Partial<GameSession>;

export default class RoomRepository {
    private getRoomKey(code: string) {
        return `room:${code}`;
    }

    public async findByCode(code: string): Promise<GameSession | null> {
        const raw = await redis.get(this.getRoomKey(code));
        if (!raw) return null;

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
        const room = await this.findByCode(code);
        if (!room) return null;

        const updated: GameSession = {
            ...room,
            ...patch
        };

        await redis.set(this.getRoomKey(code), JSON.stringify(updated), {
            EX: ROOM_TTL_SECONDS
        });

        return updated;
    }

    public async updateStatus(
        code: string,
        status: RoomStatus
    ): Promise<GameSession | null> {
        return this.update(code, { status } as Partial<GameSession>);
    }

    public async updateState(
        code: string,
        state: GameSession["state"]
    ): Promise<GameSession | null> {
        return this.update(code, { state });
    }

}