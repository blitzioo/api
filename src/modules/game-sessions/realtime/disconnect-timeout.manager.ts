const disconnectTimers = new Map<string, NodeJS.Timeout>();

const getKey = (roomCode: string, playerId: string): string => {
    return `${roomCode}:${playerId}`;
};

export const scheduleDisconnectTimeout = (
    roomCode: string,
    playerId: string,
    callback: () => Promise<void>,
    delayMs = 30_000
): void => {
    clearDisconnectTimeout(roomCode, playerId);

    const timer = setTimeout(async () => {
        try {
            await callback();
        } finally {
            disconnectTimers.delete(getKey(roomCode, playerId));
        }
    }, delayMs);

    disconnectTimers.set(getKey(roomCode, playerId), timer);
};

export const clearDisconnectTimeout = (
    roomCode: string,
    playerId: string
): boolean => {
    const key = getKey(roomCode, playerId);
    const timer = disconnectTimers.get(key);

    if (!timer) {
        return false;
    }

    clearTimeout(timer);
    disconnectTimers.delete(key);

    return true;
};