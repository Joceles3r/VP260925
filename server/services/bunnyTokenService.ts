import crypto from "crypto";

const TOKEN_SECRET = process.env.VISUAL_PLAY_TOKEN_SECRET || "dev-secret-change-me";
const DEFAULT_TTL_SECONDS = 30 * 60;

type Payload = {
  vid: string;
  uid: string;
  ip: string;
  uaHash: string;
  exp: number;
  left: number;
};

const memoryPlays = new Map<string, number>();

function sign(payload: Payload): string {
  const data = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  return `${data}.${hmac}`;
}

function verifyAndDecode(token: string): Payload | null {
  const [data, sig] = token.split(".");
  if (!data || !sig) return null;

  const good = crypto.createHmac("sha256", TOKEN_SECRET).update(data).digest("base64url");
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(good))) return null;

  try {
    return JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
  } catch {
    return null;
  }
}

export function issuePlaybackToken(
  vid: string,
  uid: string,
  ip: string,
  userAgent: string,
  maxPlays = 3,
  ttlSec = DEFAULT_TTL_SECONDS
) {
  const uaHash = crypto.createHash("sha1").update(userAgent || "").digest("hex");
  const payload: Payload = {
    vid,
    uid,
    ip,
    uaHash,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
    left: maxPlays
  };

  const token = sign(payload);
  memoryPlays.set(token, maxPlays);
  return token;
}

export function verifyAndConsume(token: string, ip: string, userAgent: string) {
  const p = verifyAndDecode(token);
  if (!p) return { ok: false as const, reason: "bad-signature" };

  if (p.exp < Math.floor(Date.now() / 1000)) {
    return { ok: false as const, reason: "expired" };
  }

  const uaHash = crypto.createHash("sha1").update(userAgent || "").digest("hex");
  if (p.ip !== ip) return { ok: false as const, reason: "ip-mismatch" };
  if (p.uaHash !== uaHash) return { ok: false as const, reason: "ua-mismatch" };

  const left = memoryPlays.get(token) ?? p.left;
  if (left <= 0) return { ok: false as const, reason: "no-plays-left" };

  memoryPlays.set(token, left - 1);
  return { ok: true as const, payload: p, left: left - 1 };
}
