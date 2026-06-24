export default class HttpError extends Error {
    public constructor(
        message: string,
        public readonly statusCode: number
    ) {
        super(message);
        this.name = "HttpError";
    }
}