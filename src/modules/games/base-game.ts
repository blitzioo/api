import { Server } from "socket.io";
import GameSessionService from "../game-sessions/game-session.service.js";
import { GameSessionState } from "../game-sessions/game-session.types.js";
import { gameClasses, GameEnum } from "./game.enum.js";
import {RoomSockets} from "../../realtime/socket-registry.js";
import { PublicRoomPlayer, RoomOptions, RoomPlayer } from "../rooms/room.types.js";
import roomEventsUtils from "../rooms/realmtime/room-events.utils.js";
export interface GameData<T = GameSessionState> {
  roomCode: string;
  players: RoomPlayer[];
  state: T;
  options: RoomOptions;
  io: Server;
}

export type TGameActionPayload = Record<string, unknown>;

export default abstract class BaseGame<TGameState extends GameSessionState> {

  private static gameInstancesByCode = new Map<string, BaseGame<any>>();

  private readonly gameSessionService = new GameSessionService();

  private readonly roomCode: string;

  private readonly players: RoomPlayer[];
  private readonly io: Server;
  private readonly roomSockets: RoomSockets;

  private state: TGameState;
  private options: RoomOptions;

  public constructor({ roomCode, players, state, io, options }: GameData<TGameState>, initialState: TGameState) {
    this.players = players;
    this.io = io;
    this.roomSockets = RoomSockets.from(roomCode);
    this.roomCode = roomCode;
    this.options = options ?? {};

    const isEmptyState = Object.keys(state).length < 1;
    this.state = isEmptyState
      ? initialState
      : state;
    if(isEmptyState) {
      this.updateState(this.state);
    }
    this.options = options;
  }

  protected getCode() {
    return this.roomCode;
  }
  protected getState() {
    return this.state;
  }
  protected getPlayers({
    publicData
  }: {publicData: boolean} = {
    publicData: false
  }): (RoomPlayer|PublicRoomPlayer)[] {
    const players = this.players;
    return publicData 
      ? players.map(p => ({id: p.id, username: p.username})) 
      : players;
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

  public abstract syncPlayer(playerId: string): Promise<void>|void;

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