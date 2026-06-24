import BaseGame, { GameData, TGameActionPayload } from "../base-game.js";
import { Card } from "../shared/cards/cards.type.js";
import { createDeck56 } from "../shared/cards/decks.js";
import { shuffleDeck } from "../shared/cards/index.js";

export interface NinetySevenPlayerState {
    cards: Card[];
}

type NinetySevenState = {
    currentPlayerIdx: number;
    direction: 1|-1;

    total: number;

    players: Record<string, NinetySevenPlayerState>;

    deck: Card[];

    discardPile: Card[];
}

export default class NinetySevenGame extends BaseGame<NinetySevenState> {

    private readonly MAX_CARDS = 4;
    private static readonly LEFT_DIR = -1;
    private static readonly RIGHT_DIR = 1;

    public constructor(data: GameData<NinetySevenState>) {
        super(data, {
            currentPlayerIdx: 0,
            direction: NinetySevenGame.RIGHT_DIR,
            players: {},
            deck: shuffleDeck(createDeck56()),
            discardPile: [],
            total: 0
        });
    }

    public async handleAction(playerId: string, action: string, payload: TGameActionPayload) {        
        switch(action) {
            case "play-card":
                const data = payload as {
                    cardIdx: number;
                    announcedTotal: number;
                }
                const state = this.getState();
                if(data.cardIdx < 0 || data.cardIdx >= this.MAX_CARDS) {
                    throw new Error("Invalid cardIdx");
                }
                if(this.getPlayers().at(state.currentPlayerIdx)?.id !== playerId) {
                    throw new Error("You are not the current player who has to play");
                }

                const result = await this.playCard(
                    playerId,
                    {
                        cardIndex: data.cardIdx,
                        announcedTotal: data.announcedTotal
                    }
                );
                this.sendTo(playerId, result.privateState);
                this.broadcast(result.publicState);
                break;
        }
    }

    public async initialize(): Promise<void> {
        const state = {
            ...this.getState(),
            deck: [...this.getState().deck],
            players: { ...this.getState().players }
        };

        for (const {id} of this.getPlayers()) {
            state.players[id] ??= {
                cards: []
            };

            while (state.players[id].cards.length < this.MAX_CARDS) {
                const card = this.drawCard(id, state);
                if (!card) break;
            }

            this.sendTo(id, state.players[id]);
        }

        await this.updateState(state);
    }

    private async playCard(
        playerId: string,
        payload: {
            cardIndex: number;
            announcedTotal: number;
        }
    ) {
        const state = this.getState();

        const {drawnCard, discardedCard} = this.discardCardAndDraw(
            playerId,
            payload.cardIndex,
            state
        );
        
        // TODO: manage special cards


        this.nextPlayer(state);
        await this.updateState(state);

        return {
            privateState: {
                drawnCard
            },
            publicState: {
                discardPile: state.discardPile,
                currentPlayerIdx: state.currentPlayerIdx,
                direction: state.direction
            }
        };
    }
    
    private nextPlayer(state: NinetySevenState) {
        const playerCount = this.getPlayers().length;

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

        state.discardPile.push(discardedCard);

        return {
            discardedCard,
            drawnCard: this.drawCard(playerId, state)
        }
    }

    private drawCard(
        playerId: string,
        state: NinetySevenState
    ): Card | null {
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
        this.updateState({
            direction: state.direction  === NinetySevenGame.RIGHT_DIR 
                    ? NinetySevenGame.LEFT_DIR 
                    : NinetySevenGame.RIGHT_DIR
        });
    }
}