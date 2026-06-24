import jwt, { SignOptions } from "jsonwebtoken";
import path from "path";
import fs from "fs";

const keysPath = path.join(process.cwd(), "keys");

const privateKey = fs.readFileSync(
    path.join(keysPath, "private.key"),
    "utf8"
);
const publicKey = fs.readFileSync(
    path.join(keysPath, "public.key"),
    "utf8"
);


interface TokenPayload {
    id: string;
}

const sign = (
    payload: TokenPayload,
    options: SignOptions = {}
): string => {
    return jwt.sign(payload, privateKey, {
        algorithm: "RS256",
        expiresIn: "30d",
        ...options,
    });
}

const decode = (token: string): TokenPayload | null => {
    try {
        return jwt.verify(token, publicKey) as TokenPayload;
    } catch {
        return null;
    }
}

export default {
    decode,
    sign
}