import { createHmac, pbkdf2Sync, randomBytes, timingSafeEqual } from "node:crypto";

const JWT_SECRET = process.env.JWT_SECRET ?? "belpost-enterprise-jwt-secret-change-in-production";
const ACCESS_TTL_SEC = 15 * 60;
const REFRESH_TTL_SEC = 7 * 24 * 60 * 60;
const PBKDF2_ROUNDS = 10_000;

function base64UrlEncode(input) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(String(input), "utf8");
  return buf.toString("base64url");
}

function base64UrlDecode(str) {
  return Buffer.from(str, "base64url");
}

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = pbkdf2Sync(password, salt, PBKDF2_ROUNDS, 64, "sha512");
  return `pbkdf2$sha512$${PBKDF2_ROUNDS}$${salt.toString("hex")}$${hash.toString("hex")}`;
}

export function verifyPassword(password, stored) {
  if (!stored || typeof stored !== "string") return false;
  if (!stored.startsWith("pbkdf2$")) {
    return stored === password;
  }
  const parts = stored.split("$");
  if (parts.length !== 5) return false;
  const rounds = Number(parts[2]);
  const salt = Buffer.from(parts[3], "hex");
  const expected = Buffer.from(parts[4], "hex");
  const actual = pbkdf2Sync(password, salt, rounds, expected.length, "sha512");
  return timingSafeEqual(actual, expected);
}

export function signJwt(payload, ttlSec) {
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSec };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(body));
  const data = `${encodedHeader}.${encodedPayload}`;
  const signature = createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  return `${data}.${signature}`;
}

export function verifyJwt(token) {
  if (!token || typeof token !== "string") return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [encodedHeader, encodedPayload, signature] = parts;
  const data = `${encodedHeader}.${encodedPayload}`;
  const expected = createHmac("sha256", JWT_SECRET).update(data).digest("base64url");
  const sigBuf = Buffer.from(signature, "utf8");
  const expBuf = Buffer.from(expected, "utf8");
  if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) return null;
  try {
    const payload = JSON.parse(base64UrlDecode(encodedPayload).toString("utf8"));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

export function createAccessToken(user) {
  return signJwt({ sub: user.email, role: user.role ?? "user", type: "access" }, ACCESS_TTL_SEC);
}

export function createRefreshToken(user) {
  return signJwt({ sub: user.email, role: user.role ?? "user", type: "refresh", jti: randomBytes(16).toString("hex") }, REFRESH_TTL_SEC);
}

export function parseCookies(req) {
  const raw = req.headers.cookie ?? "";
  const out = {};
  raw.split(";").forEach((part) => {
    const [k, ...rest] = part.trim().split("=");
    if (k) out[k] = decodeURIComponent(rest.join("="));
  });
  return out;
}

export function setRefreshCookie(res, token, { secure = false } = {}) {
  const maxAge = REFRESH_TTL_SEC;
  const flags = [
    `belpost_refresh=${encodeURIComponent(token)}`,
    "HttpOnly",
    "SameSite=Strict",
    "Path=/",
    `Max-Age=${maxAge}`,
  ];
  if (secure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

export function clearRefreshCookie(res, { secure = false } = {}) {
  const flags = ["belpost_refresh=", "HttpOnly", "SameSite=Strict", "Path=/", "Max-Age=0"];
  if (secure) flags.push("Secure");
  res.setHeader("Set-Cookie", flags.join("; "));
}

export function generateResetToken() {
  return randomBytes(32).toString("hex");
}
