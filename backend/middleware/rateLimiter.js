// In-memory sliding window rate limiter with isolated per-limiter store
export function authRateLimiter(options = {}) {
  const hits = new Map();
  const windowMs = options.windowMs || 15 * 60 * 1000; // 15 mins default
  const max = options.max || 30; // 30 requests per window
  const message = options.message || 'Too many attempts from this IP, please try again later.';

  // Periodically clean up old entries
  setInterval(() => {
    const now = Date.now();
    for (const [ip, data] of hits.entries()) {
      if (now - data.startTime > windowMs) {
        hits.delete(ip);
      }
    }
  }, 60000).unref();

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();

    if (!hits.has(ip)) {
      hits.set(ip, { count: 1, startTime: now });
      return next();
    }

    const record = hits.get(ip);
    if (now - record.startTime > windowMs) {
      record.count = 1;
      record.startTime = now;
      return next();
    }

    record.count += 1;
    if (record.count > max) {
      return res.status(429).json({
        success: false,
        message,
      });
    }

    next();
  };
}
