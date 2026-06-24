import { Server, Socket } from "socket.io";
import GameSessionService from "../game-sessions/game-session.service.js";
import { GameSessionPlayerSnapshot, GameSessionState } from "../game-sessions/game-session.types.js";
import { gameClasses, GameEnum } from "./game.enum.js";
import gameSessionRooms from "../game-sessions/realtime/game-session.rooms.js";

export interface GameData<T = GameSessionState> {
  sessionId: string;
  players: GameSessionPlayerSnapshot[];
  state: T;
  io: Server;
  sockets: Map<string, Map<string, Socket>>;
}

export type TGameActionPayload = Record<string, unknown>;

export default abstract class BaseGame<TGameState extends GameSessionState> {

  private readonly gameSessionService = new GameSessionService();
  private readonly sessionId: string;
  private readonly players: GameSessionPlayerSnapshot[];
  private readonly io: Server;
  private readonly sockets: Map<string, Map<string, Socket>>;

  private state: TGameState;

  public constructor({ sessionId, players, state, io, sockets }: GameData<TGameState>, initialState: TGameState) {
    this.sessionId = sessionId;
    this.players = players;
    this.io = io;
    this.sockets = sockets;

    const isEmptyState = Object.keys(state).length < 1;
    this.state = isEmptyState
      ? initialState
      : state;
    if(isEmptyState) {
      this.updateState(this.state);
    }
  }

  protected getSessionId() {
    return this.sessionId;
  }
  protected getState() {
    return this.state;
  }
  protected getPlayers() {
    return this.players;
  }

  protected async updateState(newState: Partial<TGameState>) {
    this.state = {
      ...this.getState(),
      ...newState
    };
    await this.gameSessionService.updateState(this.getSessionId(), this.state);
  }

  protected async endGame() {
    await this.gameSessionService.endSession(this.sessionId);
  }

  protected sendTo(playerId: string, data?:any) {
    this.sockets.get(this.sessionId)
      ?.get(playerId)
      ?.emit("game:private-state", data);
  }

  protected broadcast(data?: any) {
    gameSessionRooms.broadcast(this.io, {
      sessionId: this.sessionId,
      eventName: "game:public-state",
      data
    });
  }

  public abstract initialize(): Promise<void>|void;

  public abstract handleAction(playerId: string, action: string, data: TGameActionPayload): void|Promise<void>;

  public static loadById(gameId: GameEnum, data: GameData) {
    const GameClass = gameClasses[gameId];

    if (!GameClass) {
        throw new Error(`Game ${gameId} not found`);
    }

    return new GameClass(data);
  }

}