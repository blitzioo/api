import BaseGame from "./base-game.js";

export enum GameEnum {
    NINETY_SEVEN = "ninety-seven"
}

export const gameClasses: Record<
  GameEnum,
  () => Promise<new (...args: any[]) => BaseGame<any>>
> = {
  [GameEnum.NINETY_SEVEN]: () =>
    import("./ninety-seven/ninety-seven.game.js").then(m => m.default)
};