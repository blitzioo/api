import { Card, CardRank, CardSuit } from "./cards.type.js";

export const createDeck56 = (): Card[] => {
    const suits = Object.values(CardSuit);
    const ranks: CardRank[] = [
        "1", "2", "3", "4", "5", "6", "7", "8",
        "9", "10", "J", "Q", "K", "A"
    ];

    return suits.flatMap((suit) =>
        ranks.map((rank) => ({
            suit,
            rank
        }))
    );
};