import { GameEnum } from "./game.enum.js";

export interface GameRule {
  image?: string;
  title: string;
  description: string;
}

export interface Game {
  id: GameEnum;
  title: string;
  description: string;
  icon: string;
  backgroundColor: string;
  color: string;
  rules: GameRule[];
  options: GameOption[];
}

export type GameOption =
  | GameNumberOption
  | GameBooleanOption
  | GameSelectOption
  | GameTextOption;

export interface BaseGameOption {
  id: string;
  label: string;
  description?: string;
  required?: boolean;
}

export interface GameNumberOption extends BaseGameOption {
  type: "number";
  default: number;
  min?: number;
  max?: number;
  step?: number;
}

export interface GameBooleanOption extends BaseGameOption {
  type: "boolean";
  default: boolean;
}

export interface GameTextOption extends BaseGameOption {
  type: "text";
  default?: string;
  minLength?: number;
  maxLength?: number;
  placeholder?: string;
}

export interface GameSelectOption extends BaseGameOption {
  type: "select";
  values: {
    label: string;
    value: string;
  }[];
  default: string;
}