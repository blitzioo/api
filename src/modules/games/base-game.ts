import { Server } from "socket.io";
import GameSessionService from "../game-sessions/game-session.service.js";
<<<<<<< HEAD
import { GameSessionState } from "../game-sessions/game-session.types.js";
=======
import { GameSessionOptions, GameSessionPlayerSnapshot, GameSessionState } from "../game-sessions/game-session.types.js";
>>>>>>> d12457157a3f6915a15336b231fc24eb4233e30a
import { gameClasses, GameEnum } from "./game.enum.js";
import {RoomSockets} from "../../realtime/socket-registry.js";
import { RoomPlayer } from "../rooms/room.types.js";
import roomEventsUtils from "../rooms/realmtime/room-events.utils.js";
export interface GameData<T = GameSessionState> {
  roomCode: string;
  players: RoomPlayer[];
  state: T;
  options: GameSessionOptions;
  io: Server;
}

export type TGameActionPayload = Record<string, unknown>;

export default abstract class BaseGame<TGameState extends GameSessionState> {

  private static gameInstancesByCode = new Map<string, BaseGame<any>>();

  private readonly gameSessionService = new GameSessionService();

  private readonly roomCode: string;

  private readonly players: RoomPlayer[];
  private readonly io: Server;
<<<<<<< HEAD
  private readonly roomSockets: RoomSockets;

  private state: TGameState;

  public constructor({ roomCode, players, state, io }: GameData<TGameState>, initialState: TGameState) {
    this.players = players;
    this.io = io;
    this.roomSockets = RoomSockets.from(roomCode);
    this.roomCode = roomCode;
=======
  private readonly sockets: Map<string, Map<string, Socket>>;
  private readonly options: GameSessionOptions;

  private state: TGameState;

  public constructor({ sessionId, players, state, options, io, sockets }: GameData<TGameState>, initialState: TGameState) {
    this.sessionId = sessionId;
    this.players = players;
    this.io = io;
    this.sockets = sockets;
    this.options = options ?? {};
>>>>>>> d12457157a3f6915a15336b231fc24eb4233e30a

    const isEmptyState = Object.keys(state).length < 1;
    this.state = isEmptyState
      ? initialState
      : state;
    if(isEmptyState) {
      this.updateState(this.state);
    }
  }

  protected getCode() {
    return this.roomCode;
  }
  protected getState() {
    return this.state;
  }
  protected getPlayers() {
    return this.players;
  }
  protected getOptions() {
    return this.options;
  }

  protected getPlayer(playerId: string) {
    return this.players.find((player) => player.id === playerId);
  }

  protected async updateState(newState: TGameState) {
    this.state = newState;
    await this.gameSessionService.updateState(this.getCode(), this.state);
  }

  protected async endGame() {
    await this.gameSessionService.endSession(this.getCode());
  }

  protected sendTo(playerId: string, data?:any) {
    this.roomSockets.getSocket(playerId)
      ?.emit("game:private-data", data);
  }

  protected broadcast(data?: any) {
    roomEventsUtils.broadcast(this.io, {
      roomCode: this.roomCode,
      eventName: "game:public-data",
      data
    });
  }

<<<<<<< HEAD
  public abstract syncPlayer(playerId: string): Promise<void>|void;
=======
  protected broadcastCustomEvent(eventName: string, data?: any) {
    gameSessionRooms.broadcast(this.io, {
      sessionId: this.sessionId,
      eventName: `game:${eventName}`,
      data
    });
  }
>>>>>>> d12457157a3f6915a15336b231fc24eb4233e30a

  public abstract initialize(): Promise<void>|void;

  public abstract handleAction(playerId: string, action: string, data: TGameActionPayload): void|Promise<void>;

  public static async loadById(gameId: GameEnum, roomCode: string, data?: GameData) {
      const loader = gameClasses[gameId];

      if (!loader) {
          throw new Error(`Game ${gameId} not found`);
      }

      if(!data && BaseGame.gameInstancesByCode.has(roomCode)) {
        const instance = BaseGame.gameInstancesByCode.get(roomCode);
        return instance!;
      } else if(!data) {
        return null;
      }

      const GameClass = await loader();
      const instance = new GameClass(data);

      BaseGame.gameInstancesByCode.set(roomCode, instance);
      return instance;
  }

}