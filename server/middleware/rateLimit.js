const buckets = new Map();

export function createRateLimiter({ windowMs = 60_000, max = 60, message }) {
  return (req, res, next) => {
    const ip = String(req.headers["x-forwarded-for"] ?? req.socket?.remoteAddress ?? "unknown")
      .split(",")[0]
      .trim();
    const now = Date.now();
    let bucket = buckets.get(ip);
    if (!bucket || now - bucket.start > windowMs) {
      bucket = { start: now, count: 0 };
      buckets.set(ip, bucket);
    }
    bucket.count += 1;
    if (bucket.count > max) {
      res.status(429).json({
        message:
          message ??
          "Превышен лимит запросов. Безопасность системы ограничила доступ на 1 минуту.",
        retryAfterSec: Math.ceil((bucket.start + windowMs - now) / 1000),
      });
      return;
    }
    next();
  };
}

// periodic cleanup
setInterval(() => {
  const now = Date.now();
  for (const [ip, bucket] of buckets.entries()) {
    if (now - bucket.start > 120_000) buckets.delete(ip);
  }
}, 120_000).unref?.();
