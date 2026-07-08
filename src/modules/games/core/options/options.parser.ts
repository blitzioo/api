import { z } from "zod";
import {
  GameOption,
  GameBooleanOption,
  GameNumberOption,
  GameSelectOption,
  GameTextOption,
} from "../games/games.model.js";

type GameOptionsSchema = GameOption[] | Record<string, GameOption>;
type GameSelectedOptions = Record<string, unknown>;

export default class GamesOptionsParser {
  public static parse(options: GameOptionsSchema) {
    const normalizedOptions = this.normalizeOptions(options);
    const shape: Record<string, z.ZodTypeAny> = {};

    for (const option of normalizedOptions) {
      shape[option.id] = this.parseOption(option);
    }

    return z.object(shape);
  }

  public static parseValues(
    options: GameOptionsSchema,
    values: GameSelectedOptions = {}
  ) {
    return this.parse(options).parse(values);
  }

  private static normalizeOptions(options: GameOptionsSchema): GameOption[] {
    if (Array.isArray(options)) {
      return options;
    }

    return Object.entries(options).map(([id, option]) => ({
      ...option,
      id: option.id ?? id,
    }));
  }

  private static parseOption(option: GameOption): z.ZodTypeAny {
    switch (option.type) {
      case "number":
        return this.parseNumber(option);

      case "boolean":
        return this.parseBoolean(option);

      case "text":
        return this.parseText(option);

      case "select":
        return this.parseSelect(option);

      default:
        throw new Error(`Unknown option type for "${(option as any).id}".`);
    }
  }

  private static parseNumber(option: GameNumberOption) {
    let schema = z.coerce.number();

    if (option.min !== undefined) {
      schema = schema.min(option.min);
    }

    if (option.max !== undefined) {
      schema = schema.max(option.max);
    }

    if (option.step !== undefined && Number.isInteger(option.step)) {
      schema = schema.int();
    }

    const defaultValue = option.default ?? option.min ?? 0;

    if (option.required === false) {
      return schema.optional().default(defaultValue);
    }

    return schema.default(defaultValue);
  }

  private static parseBoolean(option: GameBooleanOption) {
    const schema = z.coerce.boolean();
    const defaultValue = option.default ?? false;

    if (option.required === false) {
      return schema.optional().default(defaultValue);
    }

    return schema.default(defaultValue);
  }

  private static parseText(option: GameTextOption) {
    let schema = z.string();

    if (option.minLength !== undefined) {
      schema = schema.min(option.minLength);
    }

    if (option.maxLength !== undefined) {
      schema = schema.max(option.maxLength);
    }

    const defaultValue = option.default ?? "";

    if (option.required === false) {
      return schema.optional().default(defaultValue);
    }

    return schema.default(defaultValue);
  }

  private static parseSelect(option: GameSelectOption) {
    if (option.values.length === 0) {
      throw new Error(`Select option "${option.id}" has no values.`);
    }

    const values = option.values.map(
      value => value.value
    ) as [string, ...string[]];

    const schema = z.enum(values);
    const defaultValue = option.default ?? values[0];

    if (option.required === false) {
      return schema.optional().default(defaultValue);
    }

    return schema.default(defaultValue);
  }
}