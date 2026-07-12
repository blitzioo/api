import { Server } from "socket.io";
import GameSessionService from "../../../game-sessions/game-session.service.js";
import { GameSessionState } from "../../../game-sessions/game-session.types.js";
import { gameClasses, GameEnum } from "./game.enum.js";
import {RoomSockets} from "../../../../realtime/socket-registry.js";
import { PlayerStatus, PublicRoomPlayer, RoomOptions, RoomPlayer } from "../../../rooms/room.types.js";
import { broadcastToRoom } from "../../../../realtime/utils/broadcast.js";

export interface GameData<T = GameSessionState, V = RoomOptions> {
  roomCode: string;
  roomHostId: string;
  players: RoomPlayer[];
  state: T;
  options: V;
  io: Server;
}

export type TGameActionPayload = Record<string, unknown>;
export type TGameAction = {
  playerId: string;
  action: string;
  data: TGameActionPayload;
}

export default abstract class BaseGame<TGameState extends GameSessionState, TGameOptions extends RoomOptions = {}> {

  private static gameInstancesByCode = new Map<string, BaseGame<any>>();

  private readonly gameSessionService = new GameSessionService();

  private readonly roomCode: string;
  private readonly roomHostId: string;

  private players: RoomPlayer[];
  private readonly io: Server;
  private readonly roomSockets: RoomSockets;

  private state: TGameState;
  private options: TGameOptions;

  public constructor({ roomCode, roomHostId, players, state, io, options }: GameData<TGameState, TGameOptions>, initialState: TGameState) {
    this.players = players;
    this.io = io;
    this.roomSockets = RoomSockets.from(roomCode);
    this.roomCode = roomCode;
    this.roomHostId = roomHostId;
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
  protected getOptions(): TGameOptions {
    return this.options;
  }
  protected getPlayer(playerId: string) {
    return this.players.find((player) => player.id === playerId);
  }

  protected getHost() {
    return this.getPlayers().find(p => p.id === this.roomHostId);
  }
  protected getHostId() {
    return this.roomHostId;
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
    broadcastToRoom(this.io, {
      roomCode: this.roomCode,
      eventName: "game:public-data",
      data
    });
  }

  public abstract syncPlayer(playerId: string): Promise<void>|void;

  public abstract handlePlayerTimeout(playerId: string): Promise<void>|void;

  protected removePlayer(playerId: string) {
    this.players.splice(
      this.players.findIndex(p => playerId === p.id),
      1
    );
  }

  public abstract initialize(): Promise<void>|void;

  public abstract handleAction(payload: TGameAction): void|Promise<void>;

  public updatePlayerConnectionStatus(id: string, status: PlayerStatus) {
    const players = this.players;
    const playerIdx = players.findIndex(p => p.id === id);
    if(playerIdx === -1) {
      throw new Error("Player not found");
    }
    this.players.at(playerIdx)!.connectionStatus = status;
    this.players = players;
  }

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