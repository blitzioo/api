import { customAlphabet } from "nanoid";

export const generateRandomCode = customAlphabet(
  "ABCDEFGHJKLMNPQRSTUVWXYZ23456789",
  6
);