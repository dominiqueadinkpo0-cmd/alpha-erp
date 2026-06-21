const pool = require('../config/database');

const SKIP_PATHS = ['/api/auth/login'];
const SKIP_METHODS = ['GET'];

function extractEntityType(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 2 && parts[0] === 'api') {
    return parts[1];
  }
  return null;
}

function extractEntityId(path) {
  const parts = path.split('/').filter(Boolean);
  if (parts.length >= 3 && parts[0] === 'api') {
    const potentialId = parts[parts.length - 1];
    if (/^\d+$/.test(potentialId)) {
      return potentialId;
    }
  }
  return null;
}

const auditLog = async (req, res, next) => {
  if (SKIP_METHODS.includes(req.method) || SKIP_PATHS.includes(req.path)) {
    return next();
  }

  const originalJson = res.json.bind(res);
  res.json = function (body) {
    res.auditBody = body;
    return originalJson(body);
  };

  const originalSend = res.send.bind(res);
  res.send = function (body) {
    res.auditBody = body;
    return originalSend(body);
  };

  res.on('finish', async () => {
    try {
      if (res.statusCode >= 400) return;

      const userId = req.user?.id || null;
      const action = `${req.method} ${req.path}`;
      const entityType = extractEntityType(req.path);
      const entityId = extractEntityId(req.path);
      const details = Object.keys(req.body || {}).length > 0 ? req.body : null;
      const ipAddress = req.ip || req.connection?.remoteAddress || null;

      await pool.query(
        `INSERT INTO activity_logs (user_id, action, entity_type, entity_id, details, ip_address)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [userId, action, entityType, entityId, details ? JSON.stringify(details) : null, ipAddress]
      );
    } catch (error) {
      console.error('Audit log error:', error.message);
    }
  });

  next();
};

module.exports = auditLog;
