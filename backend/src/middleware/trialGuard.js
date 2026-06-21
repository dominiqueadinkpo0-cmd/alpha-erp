const pool = require('../config/database');
const { AppError } = require('./errorHandler');

function getClientIp(req) {
  const forwarded = req.headers['x-forwarded-for'];
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return req.ip || req.connection.remoteAddress;
}

async function getTrialStatus(ipAddress) {
  const result = await pool.query(
    `SELECT * FROM ip_trials WHERE ip_address = $1 ORDER BY created_at DESC LIMIT 1`,
    [ipAddress]
  );

  if (result.rows.length === 0) {
    return { isActive: false, expiresAt: null, daysRemaining: 0, canExtend: false };
  }

  const trial = result.rows[0];
  const now = new Date();
  const expiresAt = new Date(trial.expires_at);

  if (expiresAt < now) {
    if (trial.is_active) {
      await pool.query('UPDATE ip_trials SET is_active = false WHERE id = $1', [trial.id]);
    }
    return { isActive: false, expiresAt: trial.expires_at, daysRemaining: 0, canExtend: false };
  }

  const daysRemaining = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
  return { isActive: true, expiresAt: trial.expires_at, daysRemaining, canExtend: true };
}

async function trialGuard(req, res, next) {
  try {
    const ip = getClientIp(req);
    const trialStatus = await getTrialStatus(ip);

    if (!trialStatus.isActive && trialStatus.expiresAt !== null) {
      return res.status(403).json({
        error: 'Free trial expired for this IP. Please upgrade to continue.'
      });
    }

    if (!trialStatus.isActive && trialStatus.expiresAt === null) {
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      const result = await pool.query(
        `INSERT INTO ip_trials (ip_address, plan_slug, expires_at) VALUES ($1, 'free', $2) RETURNING *`,
        [ip, expiresAt]
      );

      req.trial = {
        id: result.rows[0].id,
        expiresAt: result.rows[0].expires_at,
        daysRemaining: 30
      };
    } else {
      const daysRemaining = Math.ceil(
        (new Date(trialStatus.expiresAt) - new Date()) / (1000 * 60 * 60 * 24)
      );
      req.trial = {
        expiresAt: trialStatus.expiresAt,
        daysRemaining
      };
    }

    next();
  } catch (error) {
    next(error);
  }
}

async function enforceTrialLimits(planSlug, ipAddress) {
  if (planSlug !== 'free') {
    return { allowed: true };
  }

  const trialStatus = await getTrialStatus(ipAddress);

  if (!trialStatus.isActive && trialStatus.expiresAt !== null) {
    return {
      allowed: false,
      error: 'Free trial expired. Please upgrade to a paid plan.'
    };
  }

  return {
    allowed: true,
    trial: {
      expiresAt: trialStatus.expiresAt,
      daysRemaining: trialStatus.daysRemaining
    }
  };
}

module.exports = { trialGuard, getTrialStatus, enforceTrialLimits, getClientIp };
