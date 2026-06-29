import BaseGame from "./base-game.js";
<<<<<<< HEAD
=======
import NinetySevenGame from "./ninety-seven/ninety-seven.game.js";
import PmuGame from "./pmu/pmu.game.js";
>>>>>>> d12457157a3f6915a15336b231fc24eb4233e30a

export enum GameEnum {
    NINETY_SEVEN = "ninety-seven",
    PMU = "pmu"
}

<<<<<<< HEAD
export const gameClasses: Record<
  GameEnum,
  () => Promise<new (...args: any[]) => BaseGame<any>>
> = {
  [GameEnum.NINETY_SEVEN]: () =>
    import("./ninety-seven/ninety-seven.game.js").then(m => m.default)
};
=======
type GameConstructor = new (...args: any[]) => BaseGame<{}>;

export const gameClasses: Record<GameEnum, GameConstructor> = {
    [GameEnum.NINETY_SEVEN]: NinetySevenGame,
    [GameEnum.PMU]: PmuGame
};

export const gameOptionsSchema: Record<GameEnum, any> = {
    [GameEnum.NINETY_SEVEN]: {
        type: "object",
        additionalProperties: false,
        properties: {}
    },
    [GameEnum.PMU]: {
        type: "object",
        additionalProperties: false,
        properties: {
            stepNumber: {
                type: "integer",
                minimum: 1,
                maximum: 13
            }
        }
    }
}
>>>>>>> d12457157a3f6915a15336b231fc24eb4233e30a
