export type BalloonState = {
    currentPlayerIdx: number;
    pressure: number;
    exploded: boolean;
    passCount: number;
    currentRound: number;

    explosion: BalloonExplosion|null;
    give: BalloonGive|null;
}

type BalloonExplosion = {
    playerId: string;
    username: string;
    penalty: number;
};

type BalloonGive = {
    playerId: string;
    username: string;
    penalty: number;
};