import { Socket } from "socket.io";
import { resolveSessionRoom } from "./utils/broadcast.js";

class RoomSockets {

    private static socketsByRoomCode = new Map<string, Map<string, Socket>>();
    
    private readonly code: string;
    private readonly tag: string;

    private constructor(code: string) {
        this.code = code;
        this.tag = resolveSessionRoom(code);
    }

    public getSockets() {
        let sockets = RoomSockets.socketsByRoomCode.get(this.code);
        if(!sockets) {
            sockets = new Map<string, Socket>;
            RoomSockets.socketsByRoomCode.set(this.code, sockets);
        }
        return sockets;
    }

    public getSocket(id: string) {
        return this.getSockets().get(id) ?? null;
    }
    private hasSocket(id: string) {
        return this.getSocket(id) !== null;
    }

    public register(id: string, socket: Socket) {
        if(this.hasSocket(id)) return;
        
        socket.join(this.tag);        
        this.getSockets().set(id, socket);
    }
    public unregister(id: string) {
        if(!this.hasSocket(id)) return;

        const socket = this.getSocket(id)!;
        socket.leave(this.tag);
        this.getSockets().delete(id);
    }

    public isEmpty() {
        return this.getSockets().size === 0;
    }
    public flush() {
        RoomSockets.socketsByRoomCode.delete(this.code);
    }

    public static from(code: string) {
        return new RoomSockets(code);
    }

}


export {
    RoomSockets
}