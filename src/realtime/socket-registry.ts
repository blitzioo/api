import { Socket } from "socket.io";
import roomEventsUtils from "../modules/rooms/realmtime/room-events.utils.js";

class RoomSockets {

    private static socketsByRoomCode = new Map<string, Map<string, Socket>>();
    private static connectedPlayers = new Map<string, Set<string>>();
    
    private readonly code: string;
    private readonly tag: string;

    private constructor(code: string) {
        this.code = code;
        this.tag = roomEventsUtils.resolveTag(code);
    }

    public getSockets() {
        let sockets = RoomSockets.socketsByRoomCode.get(this.code);
        if(!sockets) {
            sockets = new Map<string, Socket>;
            RoomSockets.socketsByRoomCode.set(this.code, sockets);
        }
        return sockets;
    }
    public getConnectedPlayers() {
        let connectedPlayers = RoomSockets.connectedPlayers.get(this.code);
        if(!connectedPlayers) {
            connectedPlayers = new Set();
            RoomSockets.connectedPlayers.set(this.code, connectedPlayers);
        }
        return connectedPlayers;
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
        this.getConnectedPlayers().add(id);   
        
        this.getSockets().set(id, socket);
    }
    public unregister(id: string) {
        if(!this.hasSocket(id)) return;

        const socket = this.getSocket(id)!;
        socket.leave(this.tag);
        this.getConnectedPlayers().delete(id);
        
        this.getSockets().delete(id);
    }

    public isEmpty() {
        return this.getSockets().size === 0;
    }
    public flush() {
        RoomSockets.connectedPlayers.delete(this.code);
        RoomSockets.socketsByRoomCode.delete(this.code);
    }

    public static from(code: string) {
        return new RoomSockets(code);
    }

}


export {
    RoomSockets
}