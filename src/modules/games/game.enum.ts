import BaseGame from "./base-game.js";
import NinetySevenGame from "./ninety-seven/ninety-seven.game.js";

export enum GameEnum {
    NINETY_SEVEN = "ninety-seven"
}

type GameConstructor = new (...args: any[]) => BaseGame;

export const gameClasses: Record<GameEnum, GameConstructor> = {
    [GameEnum.NINETY_SEVEN]: NinetySevenGame
};