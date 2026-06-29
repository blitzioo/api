import { Room, RoomStatus } from "./room.types.js";
import redis from "../../core/redis.js";
import { GameEnum } from "../games/game.enum.js";

const ROOM_TTL_SECONDS = 60 * 60 * 24;

interface IRoomParams {
    code: string;
    hostId: string;
    gameId: GameEnum;
    options?: Record<string, unknown>;
}

export default class RoomRepository {

    private getRoomKey(code: string) {
        return `room:${code}`;
    }

    public async create(params: IRoomParams & { hostUsername: string }): Promise<Room> {
        const room: Room = {
            code: params.code,
            hostId: params.hostId,
            gameId: params.gameId,
            options: params.options ?? {},
            status: RoomStatus.WAITING,
            players: [
                {
                    id: params.hostId,
                    username: params.hostUsername,
                    isHost: true,
                    isReady: true
                }
            ],
            createdAt: new Date()
        };

        const created = await redis.set(
            this.getRoomKey(room.code),
            JSON.stringify(room),
            {
                NX: true,
                EX: ROOM_TTL_SECONDS
            }
        );

        if (!created) {
            throw new Error("Room code already exists");
        }

        return room;
    }

    public async findByCode(code: string): Promise<Room | null> {
        const rawRoom = await redis.get(this.getRoomKey(code));

        if (!rawRoom) {
            return null;
        }

        const room = JSON.parse(rawRoom) as Room;

        return {
            ...room,
            createdAt: new Date(room.createdAt)
        };
    }

    public async update(room: Room): Promise<Room> {
        await redis.set(
            this.getRoomKey(room.code),
            JSON.stringify(room),
            {
                EX: ROOM_TTL_SECONDS
            }
        );

        return room;
    }

    public async updateStatus(
        code: string,
        status: RoomStatus
    ): Promise<Room | null> {
        const room = await this.findByCode(code);

        if (!room) {
            return null;
        }

        room.status = status;

        return this.update(room);
    }

    public async delete(code: string): Promise<void> {
        await redis.del(this.getRoomKey(code));
    }
}