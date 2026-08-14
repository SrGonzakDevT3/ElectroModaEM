import crypto from "node:crypto";

const ITERATIONS = 210000;
const KEYLEN = 32;

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("base64url");
  const hash = crypto.pbkdf2Sync(password, salt, ITERATIONS, KEYLEN, "sha256").toString("base64url");
  return `pbkdf2-sha256$${ITERATIONS}$${salt}$${hash}`;
}

export function verifyPassword(password, stored) {
  const [algo, iterationsRaw, salt, expected] = String(stored || "").split("$");
  if (algo !== "pbkdf2-sha256" || !iterationsRaw || !salt || !expected) return false;
  const actual = crypto.pbkdf2Sync(password, salt, Number(iterationsRaw), KEYLEN, "sha256").toString("base64url");
  const a = Buffer.from(actual);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export function newSessionToken() { return crypto.randomBytes(32).toString("base64url"); }
export function hashToken(token) { return crypto.createHash("sha256").update(token).digest("hex"); }
