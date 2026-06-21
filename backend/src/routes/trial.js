const express = require('express');
const router = express.Router();
const { auth } = require('../middleware/auth');
const { getTrialStatus, getClientIp } = require('../middleware/trialGuard');

router.get('/status', auth, async (req, res, next) => {
  try {
    const ip = getClientIp(req);
    const trialStatus = await getTrialStatus(ip);

    res.json({
      isActive: trialStatus.isActive,
      expiresAt: trialStatus.expiresAt,
      daysRemaining: trialStatus.daysRemaining,
      expired: !trialStatus.isActive && trialStatus.expiresAt !== null
    });
  } catch (error) {
    next(error);
  }
});

router.get('/status/public', async (req, res, next) => {
  try {
    const ip = req.query.ip || getClientIp(req);
    const trialStatus = await getTrialStatus(ip);

    res.json({
      isActive: trialStatus.isActive,
      expiresAt: trialStatus.expiresAt,
      daysRemaining: trialStatus.daysRemaining,
      expired: !trialStatus.isActive && trialStatus.expiresAt !== null
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
