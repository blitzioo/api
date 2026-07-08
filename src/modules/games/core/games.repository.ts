import games from "../data/games.json" with { type: "json" };
import rules from "../data/rules.json" with { type: "json" };
import options from "../data/options.json" with { type: "json" }

import { Game, GameOption, GameRule } from "./games/games.model.js";

type Rules = Record<string, GameRule[]>;
type Options = Record<string, GameOption[]>

export default class GamesRepository {
  private readonly games: Game[] = games.map((game: any) => ({
    ...game,
    rules: (rules as Rules)[game.id] ?? [],
    options: (options as Options)[game.id] ?? []
  }));

  findAll(): Game[] {
    return this.games;
  }

  findById(id: string): Game | undefined {
    return this.games.find(game => game.id === id);
  }
}