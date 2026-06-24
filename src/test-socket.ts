import { io } from "socket.io-client";

const token = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjA4OTYzZmRjLWViMzEtNDE3ZC04MzM5LTA5YzgzOTQyOGFlYiIsImlhdCI6MTc4MjIyMTc4MCwiZXhwIjoxNzg0ODEzNzgwfQ.bzp2eftM1sIqEiMSmEFIvMs-B84JD3DuPebgHxzq_88QHdODwyEAb-qUwBbHGvAyNq-Ss25XPjgiEPRegNqs9LDswbyy_yBJ96X5uPHoZl7_CbyivbtUG54bdhtEGjR9hf_CKGoupJKJh_ULkGymKY-qbHF9-6YQHrJ4WHsZm5zYZjuA0r1MOKrnD-DwOgf-jpse87vlBJccY2YSBi6uv64U1y3le2qsErZpZ1IZe07Xz_TRqPF0-5crsGykuym1qOorqeUbCMv9EQwgE4mlAPQmJgFKAwe2zs0zbyjGva-tMyLIvl2-fQnVw4djj1oHOP_DEBH6YwjsEdOYedLusw";
const roomCode = "6ZS66N";

const socket = io("http://localhost:3000", {
    auth: { token, roomCode }
});

socket.onAny((event: any, ...args: any) => {
    console.log(event, JSON.stringify(args, null, ""));
});

socket.emit('game:action', {
    action: 'play-card',
    payload: {
        cardIdx: 0,
        announcedTotal: 42
    }
});