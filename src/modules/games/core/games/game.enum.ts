import BaseGame from "./base-game.js";

export enum GameEnum {
  NINETY_SEVEN = "ninety-seven",
  BALLOON = "balloon",
  PMU = "pmu"
}

export const gameClasses: Record<
  GameEnum,
  () => Promise<new (...args: any[]) => BaseGame<any>>
> = {
  [GameEnum.NINETY_SEVEN]: () =>
    import("../../ninety-seven/ninety-seven.game.js").then(m => m.default),
  [GameEnum.PMU]: () =>
    import("../../pmu/pmu.game.js").then(m => m.default),
  [GameEnum.BALLOON]: () =>
    import('../../balloon/balloon.game.js').then(m => m.default)
};
