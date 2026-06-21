const { isConnected, getCache, setCache, flushPattern } = require('../config/redis');

function cacheMiddleware(ttlSeconds) {
  return async (req, res, next) => {
    if (req.method !== 'GET' || !isConnected()) {
      return next();
    }

    const userId = req.user ? req.user.id : 'anon';
    const cacheKey = `cache:${req.baseUrl}:${req.originalUrl}:${userId}`;

    try {
      const cached = await getCache(cacheKey);
      if (cached) {
        return res.json(cached);
      }
    } catch (err) {
      return next();
    }

    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        setCache(cacheKey, body, ttlSeconds).catch(() => {});
      }
      return originalJson(body);
    };

    next();
  };
}

function invalidateCache(pattern) {
  return async (req, res, next) => {
    const originalJson = res.json.bind(res);
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const routePattern = `cache:${req.baseUrl}:${pattern}`;
        flushPattern(routePattern).catch(() => {});
      }
      return originalJson(body);
    };
    next();
  };
}

module.exports = { cacheMiddleware, invalidateCache };
