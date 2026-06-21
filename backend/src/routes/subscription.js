const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');
const { enforceTrialLimits, getClientIp } = require('../middleware/trialGuard');

router.use(auth);

router.get('/plans', async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM plans ORDER BY price_monthly ASC');
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/current', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT s.*, p.name as plan_name, p.slug as plan_slug, p.price_monthly, p.price_yearly, p.max_users, p.max_products, p.features
       FROM subscriptions s
       JOIN plans p ON s.plan_id = p.id
       WHERE s.user_id = $1 AND s.status IN ('active', 'trialing')
       ORDER BY s.created_at DESC
       LIMIT 1`,
      [req.user.id]
    );

    if (result.rows.length === 0) {
      const freePlan = await pool.query("SELECT * FROM plans WHERE slug = 'free'");
      return res.json({ subscription: null, plan: freePlan.rows[0] || null });
    }

    res.json({ subscription: result.rows[0], plan: result.rows[0] });
  } catch (error) {
    next(error);
  }
});

router.post('/subscribe', async (req, res, next) => {
  try {
    const { plan_id, billing_cycle } = req.body;

    if (!plan_id) {
      throw new AppError('Plan ID required', 400);
    }

    const planResult = await pool.query('SELECT * FROM plans WHERE id = $1', [plan_id]);
    if (planResult.rows.length === 0) {
      throw new AppError('Plan not found', 404);
    }

    const plan = planResult.rows[0];
    const ip = getClientIp(req);
    const trialCheck = await enforceTrialLimits(plan.slug, ip);

    if (!trialCheck.allowed) {
      throw new AppError(trialCheck.error, 403);
    }

    const existingSub = await pool.query(
      "SELECT * FROM subscriptions WHERE user_id = $1 AND status IN ('active', 'trialing')",
      [req.user.id]
    );

    if (existingSub.rows.length > 0) {
      throw new AppError('Already subscribed to a plan', 400);
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (billing_cycle === 'yearly') {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    } else {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    }

    const amount = billing_cycle === 'yearly' ? plan.price_yearly : plan.price_monthly;

    await pool.query('BEGIN');

    const subResult = await pool.query(
      `INSERT INTO subscriptions (user_id, plan_id, status, billing_cycle, current_period_start, current_period_end)
       VALUES ($1, $2, 'active', $3, $4, $5) RETURNING *`,
      [req.user.id, plan_id, billing_cycle || 'monthly', now, periodEnd]
    );

    const invoiceNumber = `SUB-${Date.now()}`;
    await pool.query(
      `INSERT INTO billing_history (user_id, subscription_id, amount, currency, status, invoice_number, description)
       VALUES ($1, $2, $3, 'EUR', 'paid', $4, $5)`,
      [req.user.id, subResult.rows[0].id, amount, invoiceNumber, `Subscription to ${plan.name}`]
    );

    await pool.query('COMMIT');

    res.status(201).json({
      subscription: subResult.rows[0],
      plan,
      message: 'Subscription created successfully'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
});

router.post('/cancel', async (req, res, next) => {
  try {
    const result = await pool.query(
      "UPDATE subscriptions SET status = 'cancelled', cancel_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP WHERE user_id = $1 AND status = 'active' RETURNING *",
      [req.user.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('No active subscription found', 404);
    }

    res.json({ subscription: result.rows[0], message: 'Subscription cancelled' });
  } catch (error) {
    next(error);
  }
});

router.get('/invoices', pagination, async (req, res, next) => {
  try {
    const { limit, offset } = req.pagination;

    const countResult = await pool.query('SELECT COUNT(*) FROM billing_history WHERE user_id = $1', [req.user.id]);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    const result = await pool.query(
      `SELECT bh.*, p.name as plan_name
       FROM billing_history bh
       LEFT JOIN subscriptions s ON bh.subscription_id = s.id
       LEFT JOIN plans p ON s.plan_id = p.id
       WHERE bh.user_id = $1
       ORDER BY bh.created_at DESC
       LIMIT $2 OFFSET $3`,
      [req.user.id, limit, offset]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.post('/upgrade', async (req, res, next) => {
  try {
    const { plan_id } = req.body;

    if (!plan_id) {
      throw new AppError('Plan ID required', 400);
    }

    const currentSub = await pool.query(
      "SELECT s.*, p.price_monthly as current_price, p.name as current_plan FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.user_id = $1 AND s.status = 'active'",
      [req.user.id]
    );

    if (currentSub.rows.length === 0) {
      throw new AppError('No active subscription to upgrade', 400);
    }

    const newPlan = await pool.query('SELECT * FROM plans WHERE id = $1', [plan_id]);
    if (newPlan.rows.length === 0) {
      throw new AppError('Plan not found', 404);
    }

    const plan = newPlan.rows[0];
    const currentPlan = currentSub.rows[0];

    if (plan.price_monthly <= currentPlan.current_price) {
      throw new AppError('Selected plan must be more expensive to upgrade', 400);
    }

    const diff = plan.price_monthly - currentPlan.current_price;

    await pool.query('BEGIN');

    const updatedSub = await pool.query(
      'UPDATE subscriptions SET plan_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [plan_id, currentSub.rows[0].id]
    );

    const invoiceNumber = `UPG-${Date.now()}`;
    await pool.query(
      `INSERT INTO billing_history (user_id, subscription_id, amount, currency, status, invoice_number, description)
       VALUES ($1, $2, $3, 'EUR', 'paid', $4, $5)`,
      [req.user.id, currentSub.rows[0].id, diff, invoiceNumber, `Upgrade to ${plan.name}`]
    );

    await pool.query('COMMIT');

    res.json({
      subscription: updatedSub.rows[0],
      plan,
      message: 'Upgrade successful'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
});

router.post('/downgrade', async (req, res, next) => {
  try {
    const { plan_id } = req.body;

    if (!plan_id) {
      throw new AppError('Plan ID required', 400);
    }

    const currentSub = await pool.query(
      "SELECT s.*, p.price_monthly as current_price, p.name as current_plan FROM subscriptions s JOIN plans p ON s.plan_id = p.id WHERE s.user_id = $1 AND s.status = 'active'",
      [req.user.id]
    );

    if (currentSub.rows.length === 0) {
      throw new AppError('No active subscription to downgrade', 400);
    }

    const newPlan = await pool.query('SELECT * FROM plans WHERE id = $1', [plan_id]);
    if (newPlan.rows.length === 0) {
      throw new AppError('Plan not found', 404);
    }

    const plan = newPlan.rows[0];
    const currentPlan = currentSub.rows[0];

    if (plan.price_monthly >= currentPlan.current_price) {
      throw new AppError('Selected plan must be less expensive to downgrade', 400);
    }

    await pool.query('BEGIN');

    const updatedSub = await pool.query(
      'UPDATE subscriptions SET plan_id = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [plan_id, currentSub.rows[0].id]
    );

    const invoiceNumber = `DWG-${Date.now()}`;
    await pool.query(
      `INSERT INTO billing_history (user_id, subscription_id, amount, currency, status, invoice_number, description)
       VALUES ($1, $2, $3, 'EUR', 'paid', $4, $5)`,
      [req.user.id, currentSub.rows[0].id, 0, invoiceNumber, `Downgrade to ${plan.name}`]
    );

    await pool.query('COMMIT');

    res.json({
      subscription: updatedSub.rows[0],
      plan,
      message: 'Downgrade successful. Changes take effect at end of billing period.'
    });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
});

module.exports = router;
