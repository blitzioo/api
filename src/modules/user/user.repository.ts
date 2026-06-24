import User from "./user.model.js";
import { AuthUser } from "./user.types.js";

export default class UserRepository {

    public async create(username: string): Promise<AuthUser> {
        const user = await User.create({ username });
        return user.toJSON();
    }

    public async get(id: string): Promise<AuthUser|null> {
        const user = await User.findByPk(id);
        return user?.toJSON() ?? null;
    }

}