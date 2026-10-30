import { randomBytes } from "crypto";

export function generateTicketCode(): string {
  return randomBytes(8).toString("base64url"); // CSPRNG, ~64 bits, URL-safe, unguessable
}
