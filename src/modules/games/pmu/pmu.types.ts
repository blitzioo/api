import { Card, CardSuit } from "../shared/cards/cards.type.js";

export type PmuChoice = {
    cardSuit: CardSuit;
    bet: number;
}
export type PmuState = {
    stepNumber: number;
    maxNumberReach: number;
    choices: Record<string, PmuChoice>;
    position: Record<CardSuit, number>;
    sideCards: Card[];
    deck: Card[];
    started: boolean;
    isFinished: boolean;
    winner: CardSuit | null;
    lastDrawnCard: Card | null;
};

export type PmuOptions = {
    step: number;
    bet: number;
}