import RoomRepository from "./room.repository.js";
import { Room, PlayerStatus, RoomStatus } from "./room.types.js";
import { GameEnum } from "../games/core/games/game.enum.js";
import { generateRandomCode } from "../../utils/global.utils.js";
import HttpError from "../../core/errors/http-error.js";
import GamesRepository from "../games/core/games.repository.js";
import { Game } from "../games/core/games/games.model.js";

export type RoomWithGame = Room & {
    game: Game;
};

export default class RoomService {
    private readonly gameRepository = new GamesRepository();
    private readonly roomRepository = new RoomRepository();

    private enrichRoom(room: Room, providedGameData?: Game): RoomWithGame {
        const game = providedGameData ?? this.gameRepository.findById(room.gameId);

        if (!game) {
            throw new HttpError("Game not found", 500);
        }

        return {
            ...room,
            game
        };
    }

    public async getRoom(code: string): Promise<RoomWithGame | null> {
        const room = await this.roomRepository.findByCode(code);

        if (!room) {
            return null;
        }

        return this.enrichRoom(room);
    }

    public async createRoom(
        hostId: string,
        hostUsername: string,
        gameId: GameEnum
    ): Promise<RoomWithGame> {
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                const game = this.gameRepository.findById(gameId);
                if(!game) {
                    throw new Error("No game found for id " + gameId);
                }

                const createdRoom = await this.roomRepository.create({
                    code: generateRandomCode(),
                    hostId,
                    hostUsername,
                    gameId
                });

                return this.enrichRoom(createdRoom, game);
            } catch (error) {
                if (!(error instanceof Error)) {
                    throw error;
                }

                if (error.message === "Room code already exists") {
                    continue;
                }

                throw error;
            }
        }

        throw new HttpError("Unable to generate unique room code", 500);
    }

    public async joinRoom(
        code: string,
        player: { id: string; username: string }
    ): Promise<Room> {
        const room = await this.roomRepository.findByCode(code);

        if (!room) {
            throw new HttpError("Room not found", 404);
        }

        if (room.status !== RoomStatus.WAITING) {
            throw new HttpError("Room already started", 409);
        }

        const alreadyInRoom = room.players.some((p) => p.id === player.id);

        if (!alreadyInRoom) {
            room.players.push({
                id: player.id,
                username: player.username,
                connectionStatus: PlayerStatus.CONNECTED
            });
        }

        return this.roomRepository.update(room);
    }

    public async leaveRoom(
        code: string,
        playerId: string
    ): Promise<Room> {
        const room = await this.roomRepository.findByCode(code);

        if (!room) {
            throw new HttpError("Room not found", 404);
        }

        if (room.status !== RoomStatus.WAITING) {
            throw new HttpError("Cannot leave room after game started", 409);
        }

        const playerExists = room.players.some((p) => p.id === playerId);

        if (!playerExists) {
            throw new HttpError("Player is not in room", 404);
        }

        room.players = room.players.filter((p) => p.id !== playerId);

        if (room.players.length === 0) {
            return this.enrichRoom(room);
        }

        if (room.hostId === playerId) {
            const newHost = room.players[0];

            room.hostId = newHost.id;

            room.players = room.players.map((player) => ({
                ...player,
                isHost: player.id === newHost.id
            }));
        }

        return this.roomRepository.update(room);
    }

    public async startRoom(code: string): Promise<Room> {
        const room = await this.roomRepository.findByCode(code);

        if (!room) {
            throw new HttpError("Room not found", 404);
        }

        if (room.status !== RoomStatus.WAITING) {
            throw new HttpError("Room already started", 409);
        }

        room.status = RoomStatus.PLAYING;

        return this.roomRepository.update(room);
    }
}