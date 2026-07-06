import BaseGame, { GameData, TGameActionPayload } from "../base-game.js";
import { Card } from "../shared/cards/cards.type.js";
import { createDeck56 } from "../shared/cards/decks.js";
import cards, { shuffleDeck } from "../shared/cards/index.js";
import { NinetySevenJackChoice, NinetySevenState } from "./ninety-seven.types.js";

export default class NinetySevenGame extends BaseGame<NinetySevenState> {
    private readonly MAX_CARDS = 4;
    private readonly MAX_TOTAL = 97;

    private static readonly LEFT_DIR = -1;
    private static readonly RIGHT_DIR = 1;

    public constructor(data: GameData<NinetySevenState>) {
        super(data, {
            currentPlayerIdx: 0,
            direction: NinetySevenGame.RIGHT_DIR,
            players: {},
            deck: shuffleDeck(createDeck56()),
            discardPile: [],
            total: 0,
            isFinished: false,
            gameResult: null
        });
    }

    public async handleAction(
        playerId: string,
        action: string,
        payload: TGameActionPayload
    ) {
        switch (action) {
            case "play-card": {
                const data = payload as {
                    cardIdx: number;
                    announcedTotal: number;
                    jackChoice?: NinetySevenJackChoice;
                };

                if (!Number.isInteger(data.cardIdx) || data.cardIdx < 0) {
                    throw new Error("Invalid cardIdx");
                }

                const result = await this.playCard(playerId, {
                    cardIndex: data.cardIdx,
                    announcedTotal: data.announcedTotal,
                    jackChoice: data.jackChoice
                });

                this.sendTo(playerId, result.privateState);
                this.broadcast(result.publicState);
                break;
            }
        }
    }

    public async initialize(): Promise<void> {
        const state = this.getState();

        for (const { id } of this.getPlayers()) {
            state.players[id] ??= {
                cards: []
            };

            while (state.players[id].cards.length < this.MAX_CARDS) {
                const card = this.drawCard(id, state);

                if (!card) {
                    break;
                }
            }
        }

        await this.updateState(state);

        for (const { id } of this.getPlayers()) {
            this.sendTo(id, {
                cards: state.players[id]?.cards ?? []
            });
        }

        this.broadcastPublicState(state);
    }

    public async syncPlayer(playerId: string) {
        const state = this.getState();

        this.sendTo(playerId, {
            cards: state.players[playerId]?.cards ?? []
        });

        this.broadcastPublicState(state);
    }

    private async playCard(
        playerId: string,
        payload: {
            cardIndex: number;
            announcedTotal: number;
            jackChoice?: NinetySevenJackChoice;
        }
    ) {
        const state = this.getState();
        const players = this.getPlayers();

        if (state.isFinished) {
            throw new Error("Game is already finished");
        }

        const playedPlayerIdx = state.currentPlayerIdx;
        const playedPlayer = players[playedPlayerIdx];

        if (!playedPlayer) {
            throw new Error("Current player not found");
        }

        if (playedPlayer.id !== playerId) {
            throw new Error("You are not the current player who has to play");
        }

        const announcedTotal = payload.announcedTotal;

        const { drawnCard, discardedCard } = this.discardCardAndDraw(
            playerId,
            payload.cardIndex,
            state
        );

        this.applyCardEffect(discardedCard, payload.jackChoice, state);

        const realTotal = state.total;
        const difference = Math.abs(realTotal - announcedTotal);
        const penalty = difference;
        const isCorrect = difference === 0;

        if (this.isGameFinished(state)) {
            state.isFinished = true;
            state.gameResult = {
                loser: {
                    id: playedPlayer.id,
                    username: playedPlayer.username
                }
            };
            await this.endGame();
        } else {
            this.nextPlayer(state);
        }

        await this.updateState(state);

        const turnId = crypto.randomUUID();

        return {
            privateState: {
                drawnCard
            },
            publicState: {
                discardPile: state.discardPile,
                currentPlayerIdx: state.currentPlayerIdx,
                direction: state.direction,
                total: state.total,
                players: players.map(player => ({
                    id: player.id,
                    username: player.username
                })),
                isFinished: state.isFinished,
                gameResult: state.gameResult,
                lastTurnResult: {
                    id: turnId,
                    playedPlayer: {
                        id: playedPlayer.id,
                        username: playedPlayer.username
                    },
                    announcedTotal,
                    realTotal,
                    newTotal: state.total,
                    difference,
                    penalty,
                    isCorrect,
                    isGameFinished: state.isFinished,
                    gameResult: state.gameResult
                }
            }
        };
    }

    private applyCardEffect(
        card: Card,
        jackChoice: NinetySevenJackChoice | undefined,
        state: NinetySevenState
    ) {
        if (!cards.isFigure(card)) {
            state.total += Number(card.rank);
            return;
        }

        if (card.rank === "J") {
            if (jackChoice !== -10 && jackChoice !== 10) {
                throw new Error("Jack choice is required");
            }

            state.total += jackChoice;

            if (state.total < 0) {
                state.total = 0;
            }

            return;
        }

        if (card.rank === "Q") {
            this.changeDirection(state);
            return;
        }

        if (card.rank === "K") {
            state.total = 70;
            return;
        }

        if (card.rank === "A") {
            state.total++;
        }

        if(state.total >= this.MAX_CARDS) {
            state.total = this.MAX_CARDS
        }
    }

    private nextPlayer(state: NinetySevenState) {
        const playerCount = this.getPlayers().length;

        if (playerCount <= 0) {
            return;
        }

        state.currentPlayerIdx = (
            state.currentPlayerIdx + state.direction + playerCount
        ) % playerCount;
    }

    private discardCardAndDraw(
        playerId: string,
        cardIndex: number,
        state: NinetySevenState
    ) {
        const player = state.players[playerId];

        if (!player) {
            throw new Error("Player not found");
        }

        if (cardIndex < 0 || cardIndex >= player.cards.length) {
            throw new Error("Invalid card index");
        }

        const [discardedCard] = player.cards.splice(cardIndex, 1);

        if (!discardedCard) {
            throw new Error("Invalid discarded card");
        }

        state.discardPile.push(discardedCard);

        return {
            discardedCard,
            drawnCard: this.drawCard(playerId, state)
        };
    }

    private drawCard(
        playerId: string,
        state: NinetySevenState
    ): Card | null {
        state.players[playerId] ??= {
            cards: []
        };

        let card = state.deck.pop();

        if (!card) {
            state.deck = shuffleDeck(createDeck56());
            card = state.deck.pop();
        }

        if (!card) {
            return null;
        }

        state.players[playerId].cards.push(card);

        return card;
    }

    private changeDirection(state: NinetySevenState) {
        state.direction = state.direction === NinetySevenGame.RIGHT_DIR
            ? NinetySevenGame.LEFT_DIR
            : NinetySevenGame.RIGHT_DIR;
    }

    private isGameFinished(state: NinetySevenState) {
        return state.total >= this.MAX_TOTAL;
    }

    private broadcastPublicState(state: NinetySevenState) {
        this.broadcast({
            discardPile: state.discardPile,
            direction: state.direction,
            currentPlayerIdx: state.currentPlayerIdx,
            total: state.total,
            players: this.getPlayers({ publicData: true }),
            isFinished: state.isFinished,
            gameResult: state.gameResult
        });
    }
}