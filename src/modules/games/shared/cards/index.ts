import { Card, CardRank } from "./cards.type.js";

export const shuffleDeck = <T>(deck: T[]): T[] => {
  return [...deck].sort(() => Math.random() - 0.5);
}

const isFigure = (card: Card) => {
  const figures: CardRank[] = ["J", "Q", "K", "A"];
  return figures.includes(card.rank);
}

export default {
  isFigure
}