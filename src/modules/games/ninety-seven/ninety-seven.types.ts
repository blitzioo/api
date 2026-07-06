import { Card } from "../shared/cards/cards.type.js";

export interface NinetySevenPlayerState {
    cards: Card[];
}

export type NinetySevenGameResult = {
    loser: {
        id: string;
        username: string;
    };
};

export type NinetySevenState = {
    currentPlayerIdx: number;
    direction: 1 | -1;
    total: number;
    players: Record<string, NinetySevenPlayerState>;
    deck: Card[];
    discardPile: Card[];
    isFinished: boolean;
    gameResult: NinetySevenGameResult | null;
}

export type NinetySevenJackChoice = -10 | 10;