import RoomRepository from "./room.repository.js";
import { Room, RoomStatus } from "./room.types.js";
import { GameEnum } from "../games/game.enum.js";
import { generateRandomCode } from "../../utils/global.utils.js";
import HttpError from "../../core/errors/http-error.js";
import GameSessionRepository from "../game-sessions/game-session.repository.js";

export default class RoomService {
    private readonly roomRepository = new RoomRepository();
    private readonly gameSessionRepository = new GameSessionRepository();

    public async getRoom(code: string) {
        return this.roomRepository.findByCode(code);
    }

    public async createRoom(
        hostId: string,
        hostUsername: string,
        gameId: GameEnum
    ): Promise<Room> {
        const maxAttempts = 5;

        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            try {
                return await this.roomRepository.create({
                    code: generateRandomCode(),
                    hostId,
                    hostUsername,
                    gameId
                });
            } catch (error) {
                if (!(error instanceof Error)) throw error;
                if (error.message !== "Room code already exists") throw error;
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
                isHost: room.hostId === player.id,
                isReady: true
            });
        }

        return this.roomRepository.update(room);
    }

    public async startRoom(
        code: string,
        userId: string
    ) {
        const room = await this.roomRepository.findByCode(code);

        if (!room) {
            throw new HttpError("Room not found", 404);
        }

        if (room.hostId !== userId) {
            throw new HttpError("Only host can start the room", 403);
        }

        if (room.status !== RoomStatus.WAITING) {
            throw new HttpError("Room is not waiting", 409);
        }

        const gameSession = await this.gameSessionRepository.create({
            gameId: room.gameId,
            hostId: room.hostId,
            roomCode: room.code,
            playersSnapshot: room.players,
            state: {}
        });

        room.status = RoomStatus.PLAYING;

        const updatedRoom = await this.roomRepository.update(room);

        return {
            room: updatedRoom,
            gameSession
        };
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
            await this.roomRepository.delete(code);
            return room;
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
}