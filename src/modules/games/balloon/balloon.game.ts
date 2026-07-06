import BaseGame, { GameData, TGameActionPayload } from "../base-game.js";
import { BalloonState } from "./balloon.types.js";

export default class BalloonGame extends BaseGame<BalloonState> {
    public constructor(data: GameData<BalloonState>) {
        super(data, {
            currentPlayerIdx: 0,
            pressure: 0,
            exploded: false,
            explosion: null,
            give: null,
            currentRound: 1
        });
    }

    private static explosionChance(pressure: number) {
        const x = pressure;

        const midpoint = 5.8;
        const steepness = 0.9;

        const sigmoid = 1 / (1 + Math.exp(-(x - midpoint) * steepness));

        const min = 0;
        const max = 0.50;

        return Math.min(max, Math.max(min, sigmoid));
    }

    public handleAction(playerId: string, action: string, data: TGameActionPayload): void | Promise<void> {
        const state = this.getState();

        switch (action) {
            case "pump":
                this.pump(state);
                break;

            case "pass":
                this.pass(state);
                break;
        }
    }

    public syncPlayer(): void {
        this.broadcastPublicData(this.getState());
    }

    public initialize(): void {
        this.broadcastPublicData(this.getState());
    }

    private pump(state: BalloonState) {
        state.pressure++;

        const chance = BalloonGame.explosionChance(state.pressure);

        state.give = null;
        state.exploded = Math.random() < chance;

        const player = this.getPlayers()[state.currentPlayerIdx];

        if (state.exploded) {
            const penalty = Math.max(1, state.currentRound);

            state.explosion = {
                playerId: player.id,
                username: player.username,
                penalty
            };

            state.give = null;
            state.pressure = 0;
            state.currentRound = 1;

            this.nextPlayer(state, false);
            this.broadcastPublicData(state);
            this.updateState(state);
            return;
        }

        state.explosion = null;

        this.nextPlayer(state, true);
        this.broadcastPublicData(state);
        this.updateState(state);
    }

    private pass(state: BalloonState) {
        const player = this.getPlayers()[state.currentPlayerIdx];

        const penalty = Math.max(state.currentRound);

        state.give = {
            playerId: player.id,
            username: player.username,
            penalty
        };

        state.explosion = null;
        state.exploded = false;

        this.nextPlayer(state, true);
        this.broadcastPublicData(state);
        this.updateState(state);
    }

    private nextPlayer(state: BalloonState, incrementTour: boolean) {
        const players = this.getPlayers();

        if (!players.length) return;

        const previousPlayerIdx = state.currentPlayerIdx;

        state.currentPlayerIdx = (state.currentPlayerIdx + 1) % players.length;

        if (
            incrementTour &&
            previousPlayerIdx === players.length - 1 &&
            state.currentPlayerIdx === 0
        ) {
            state.currentRound++;
        }
    }

    public broadcastPublicData(state: BalloonState) {
        this.broadcast({
            currentPlayerIdx: state.currentPlayerIdx,
            pressure: state.pressure,
            exploded: state.exploded,
            explosion: state.explosion,
            give: state.give,
            currentRound: state.currentRound,
            players: this.getPlayers({ publicData: true })
        });
    }
}