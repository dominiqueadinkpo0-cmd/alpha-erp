const rateLimitStore = new Map();

function rateLimit(limit, windowMs) {
  return (req, res, next) => {
    const key = req.ip;
    const now = Date.now();

    if (!rateLimitStore.has(key)) {
      rateLimitStore.set(key, []);
    }

    const timestamps = rateLimitStore.get(key);
    const windowStart = now - windowMs;

    while (timestamps.length > 0 && timestamps[0] <= windowStart) {
      timestamps.shift();
    }

    if (timestamps.length >= limit) {
      return res.status(429).json({
        error: 'Too many requests',
        code: 'RATE_LIMIT_EXCEEDED',
        retryAfter: Math.ceil((timestamps[0] + windowMs - now) / 1000)
      });
    }

    timestamps.push(now);
    next();
  };
}

const generalLimiter = rateLimit(100, 15 * 60 * 1000);

const authLimiter = rateLimit(5, 15 * 60 * 1000);

const sanitizeInput = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    sanitizeObject(req.body);
  }
  next();
};

function sanitizeObject(obj) {
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'string') {
      obj[key] = obj[key].replace(/<[^>]*>/g, '');
    } else if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      sanitizeObject(obj[key]);
    }
  }
}

const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(`${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`);
  });

  next();
};

setInterval(() => {
  const now = Date.now();
  for (const [key, timestamps] of rateLimitStore) {
    while (timestamps.length > 0 && timestamps[0] <= now - 15 * 60 * 1000) {
      timestamps.shift();
    }
    if (timestamps.length === 0) {
      rateLimitStore.delete(key);
    }
  }
}, 60 * 60 * 1000);

module.exports = { rateLimit, generalLimiter, authLimiter, sanitizeInput, requestLogger };
