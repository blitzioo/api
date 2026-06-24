export const shuffleDeck = <T>(deck: T[]): T[] => {
  return [...deck].sort(() => Math.random() - 0.5);
}