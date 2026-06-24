import jwtService from "../auth/jwt.service.js";
import UserRepository from "./user.repository.js"

export default class UserService {

    private readonly userRepository = new UserRepository();
    
    public async createAsGuest(username: string) {
        const user = await this.userRepository.create(username);
        const token = jwtService.sign({id: user.id});
        return token; 
    }

    public async findById(id: string) {
        return this.userRepository.get(id);
    }

}