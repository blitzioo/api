import { RoomPlayer } from "../../rooms/room.types.js";
import BaseGame, { GameData, TGameActionPayload } from "../base-game.js";
import { Card, CardSuit } from "../shared/cards/cards.type.js";
import { createDeck56 } from "../shared/cards/decks.js";
import { shuffleDeck } from "../shared/cards/index.js";
import { PmuChoice, PmuState } from "./pmu.types.js";

const DEFAULT_STEP = 6;
const MIN_STEP = 3;
const MAX_STEP = 12;

const DEFAULT_BET = 1;
const MIN_BET = 1;
const MAX_BET = 10;
const LOSER_MULTIPLIER = 1;
const WINNER_MULTIPLIER = 2;

export default class PmuGame extends BaseGame<PmuState> {

    public constructor(data: GameData<PmuState>) {
        const stepNumber = PmuGame.resolveStepNumber(data.options?.stepNumber);

        const deck = shuffleDeck(
            createDeck56().filter(card => card.rank !== "A")
        );

        const sideCards: Card[] = [];
        for (let i = 0; i < stepNumber; i++) {
            const card = deck.pop();
            if (card) {
                sideCards.push(card);
            }
        }

        super(data, {
            stepNumber,
            maxNumberReach: 0,
            choices: {},
            position: {
                [CardSuit.CLUBS]: 0,
                [CardSuit.DIAMONDS]: 0,
                [CardSuit.HEARTS]: 0,
                [CardSuit.SPADES]: 0
            },
            deck,
            sideCards,
            started: false,
            isFinished: false,
            winner: null,
            lastDrawnCard: null
        });
    }

    private static resolveStepNumber(raw: unknown): number {
        const value = Math.trunc(Number(raw));

        if (!Number.isFinite(value)) {
            return DEFAULT_STEP;
        }

        return Math.max(MIN_STEP, Math.min(MAX_STEP, value));
    }

    private static resolveBet(raw: unknown): number {
        const value = Math.trunc(Number(raw));

        if (!Number.isFinite(value)) {
            return DEFAULT_BET;
        }

        return Math.max(MIN_BET, Math.min(MAX_BET, value));
    }

    public async initialize(): Promise<void> {
        this.broadcast(this.getPublicState());
    }

    public async syncPlayer(playerId: string): Promise<void> {
        const state = this.getState();

        this.sendTo(playerId, {
            choice: state.choices[playerId] ?? null
        });

        this.broadcast(this.getPublicState());
    }

    public async handleAction(
        playerId: string,
        action: string,
        payload: TGameActionPayload
    ) {
        switch (action) {
            case "make-choice": {
                await this.makeChoice(playerId, payload);
                break;
            }

            case "play-round": {
                if (!this.getPlayer(playerId)?.isHost) {
                    throw new Error("Only the host can play a round");
                }
                await this.playRound();
                break;
            }

            default:
                throw new Error(`Unknown action: ${action}`);
        }
    }

    private async makeChoice(playerId: string, payload: TGameActionPayload) {
        const { choice } = payload as { choice?: PmuChoice };

        if (!choice || !Object.values(CardSuit).includes(choice.cardSuit)) {
            throw new Error("Invalid or missing card suit");
        }

        const state = this.getState();

        if (state.started) {
            throw new Error("Game already started, bets are closed");
        }

        const normalized: PmuChoice = {
            cardSuit: choice.cardSuit,
            bet: PmuGame.resolveBet(choice.bet)
        };

        state.choices[playerId] = normalized;
        await this.updateState(state);

        this.sendTo(playerId, { choice: normalized });
        this.broadcast(this.getPublicState());
    }

    private async playRound() {
        const state = this.getState();

        if (state.isFinished) {
            throw new Error("Game is already finished");
        }

        state.started = true;

        const card = state.deck.pop();

        if (!card) {
            await this.finish(state);
            return;
        }

        state.lastDrawnCard = card;

        const nextPosition = state.position[card.suit] + 1;
        state.position[card.suit] = nextPosition;

        if (nextPosition >= state.stepNumber) {
            await this.finish(state);
            return;
        }

        if (nextPosition > state.maxNumberReach) {
            state.maxNumberReach = nextPosition;

            const sideCard = state.sideCards[nextPosition];
            if (sideCard && state.position[sideCard.suit] > 0) {
                state.position[sideCard.suit] -= 1;
            }
        }

        await this.updateState(state);
        this.broadcast(this.getPublicState());
    }

    private async finish(state: PmuState) {
        state.isFinished = true;
        state.winner = this.getWinner(state);

        await this.updateState(state);
        await this.endGame();

        this.broadcast(this.getPublicState());
    }

    private getWinner(state: PmuState): CardSuit {
        const [winningSuit] = Object.entries(state.position)
            .reduce((best, current) => (current[1] > best[1] ? current : best));

        return winningSuit as CardSuit;
    }

    private getPublicState() {
        const state = this.getState();

        return {
            stepNumber: state.stepNumber,
            maxNumberReach: state.maxNumberReach,
            position: state.position,
            handicaps: this.getHandicaps(state),
            lastDrawnCard: state.lastDrawnCard,
            started: state.started,
            isFinished: state.isFinished,
            winner: state.winner,
            choices: state.choices,
            results: this.getResults(state),
            players: this.getPlayers({ publicData: true }),
            hostId: this.getPlayers().find((player) => (player as RoomPlayer).isHost)?.id ?? null
        };
    }

    // Décompte des gorgées quand la course est finie :
    // le gagnant (a misé sur la couleur gagnante) fait boire sa mise ×2,
    // le perdant boit sa mise.
    private getResults(state: PmuState) {
        if (!state.isFinished || !state.winner) {
            return null;
        }

        return this.getPlayers()
            .filter(player => state.choices[player.id])
            .map(player => {
                const choice = state.choices[player.id]!;
                const won = choice.cardSuit === state.winner;

                return {
                    id: player.id,
                    username: player.username,
                    cardSuit: choice.cardSuit,
                    bet: choice.bet,
                    won,
                    gorgees: choice.bet * (won ? WINNER_MULTIPLIER : LOSER_MULTIPLIER)
                };
            });
    }

    private getHandicaps(state: PmuState) {
        const handicaps: { step: number; card: Card | null }[] = [];

        for (let step = 1; step < state.stepNumber; step++) {
            handicaps.push({
                step,
                card: step <= state.maxNumberReach
                    ? state.sideCards[step] ?? null
                    : null
            });
        }

        return handicaps;
    }
}
