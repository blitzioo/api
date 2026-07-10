import BaseGame, { GameData, TGameAction } from "../core/games/base-game.js";
import { BalloonState } from "./balloon.types.js";

export default class BalloonGame extends BaseGame<BalloonState> {

    private readonly DANGER_STARTING_POINT = 13;
    private readonly DANGER_GROWTH = 0.45;
    private readonly MIN_CHANCE = 0;
    private readonly MAX_CHANCE = 0.45;

    public constructor(data: GameData<BalloonState>) {
        super(data, {
            currentPlayerIdx: 0,
            pressure: 0,
            passCount: 0,
            exploded: false,
            explosion: null,
            give: null,
            currentRound: 1
        });
    }

    private explosionChance(pressure: number) {
        const x = pressure;

        const sigmoid = 1 / (1 + Math.exp(-(x - this.DANGER_STARTING_POINT) * this.DANGER_GROWTH));

        return Math.min(this.MAX_CHANCE, Math.max(this.MIN_CHANCE, sigmoid));
    }

    public handleAction({ playerId, action }: TGameAction): void | Promise<void> {
        const state = this.getState();
        const currentPlayer = this.getPlayers()[state.currentPlayerIdx];

        if (!currentPlayer || currentPlayer.id !== playerId) {
            return;
        }

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
        const player = this.getPlayers()[state.currentPlayerIdx];

        if (!player) {
            return;
        }

        state.pressure++;

        const effectivePressure = state.pressure + state.passCount * 0.65;
        const chance = this.explosionChance(effectivePressure);

        state.give = null;
        state.exploded = Math.random() < chance;

        if (state.exploded) {
            const pressureBonus = Math.floor(state.pressure / Math.max(1, this.getPlayers().length));
            const passBonus = Math.floor(state.passCount / 2);
            const penalty = Math.max(1, state.currentRound + pressureBonus + passBonus);

            state.explosion = {
                playerId: player.id,
                username: player.username,
                penalty
            };

            state.give = null;
            state.pressure = 0;
            state.passCount = 0;
            state.currentRound = 1;

            this.nextPlayer(state, false);
            this.broadcastPublicData(state);
            this.updateState(state);
            return;
        }

        state.explosion = null;
        state.passCount = 0;

        this.nextPlayer(state, true);
        this.broadcastPublicData(state);
        this.updateState(state);
    }

    private pass(state: BalloonState) {
        const player = this.getPlayers()[state.currentPlayerIdx];

        if (!player) {
            return;
        }

        const penalty = Math.max(1, state.currentRound);

        state.give = {
            playerId: player.id,
            username: player.username,
            penalty
        };

        state.passCount++;
        state.explosion = null;
        state.exploded = false;

        this.nextPlayer(state, true);
        this.broadcastPublicData(state);
        this.updateState(state);
    }

    private nextPlayer(state: BalloonState, incrementRound: boolean) {
        const players = this.getPlayers();

        if (!players.length) {
            return;
        }

        const previousPlayerIdx = state.currentPlayerIdx;

        state.currentPlayerIdx = (state.currentPlayerIdx + 1) % players.length;

        if (
            incrementRound &&
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
            passCount: state.passCount,
            exploded: state.exploded,
            explosion: state.explosion,
            give: state.give,
            currentRound: state.currentRound,
            players: this.getPlayers({ publicData: true })
        });
    }
}