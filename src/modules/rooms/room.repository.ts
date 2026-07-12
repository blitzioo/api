import { Room, RoomOptions, PlayerStatus, RoomStatus } from "./room.types.js";
import redis from "../../core/redis.js";
import { GameEnum } from "../games/core/games/game.enum.js";

interface IRoomParams {
    code: string;
    hostId: string;
    hostUsername: string;
    gameId: GameEnum;
}

export default class RoomRepository {

    public static ROOM_TTL_SECONDS = 60 * 60 * 24;
    public static getRoomKey(code: string) {
        return `room:${code}`;
    }

    public async create(params: IRoomParams): Promise<Room> {
        const room: Room = {
            code: params.code,
            hostId: params.hostId,
            gameId: params.gameId,
            options: {},
            status: RoomStatus.WAITING,
            players: [
                {
                    id: params.hostId,
                    username: params.hostUsername,
                    connectionStatus: PlayerStatus.CONNECTED
                }
            ],
            createdAt: new Date()
        };

        const created = await redis.set(
            RoomRepository.getRoomKey(room.code),
            JSON.stringify(room),
            {
                NX: true,
                EX: RoomRepository.ROOM_TTL_SECONDS
            }
        );

        if (!created) {
            throw new Error("Room code already exists");
        }

        return room;
    }

    public async findByCode(code: string): Promise<Room | null> {
        const rawRoom = await redis.get(RoomRepository.getRoomKey(code));

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
            RoomRepository.getRoomKey(room.code),
            JSON.stringify(room),
            {
                EX: RoomRepository.ROOM_TTL_SECONDS
            }
        );

        return room;
    }

    public async updateOptions(
        code: string,
        options: RoomOptions
    ): Promise<Room|null> {
        const room = await this.findByCode(code);

        if (!room) {
            return null;
        }

        room.options = options;
        return this.update(room);
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
        await redis.del(RoomRepository.getRoomKey(code));
    }
}