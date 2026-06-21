const pool = require('../config/database');

const PLANS = {
  free: { max_users: 1, max_products: 50, features: ['basic'] },
  starter: { max_users: 5, max_products: 500, features: ['basic', 'email_notifications'] },
  professional: { max_users: 25, max_products: -1, features: ['basic', 'email_notifications', 'integrations', 'reports'] },
  enterprise: { max_users: -1, max_products: -1, features: ['basic', 'email_notifications', 'integrations', 'reports', 'priority_support', 'custom_features'] }
};

async function getUserPlan(userId) {
  const result = await pool.query(
    `SELECT p.slug, p.features, p.max_users, p.max_products
     FROM subscriptions s
     JOIN plans p ON s.plan_id = p.id
     WHERE s.user_id = $1 AND s.status = 'active'
     ORDER BY s.created_at DESC
     LIMIT 1`,
    [userId]
  );

  if (result.rows.length === 0) {
    return PLANS.free;
  }

  return result.rows[0];
}

function checkPlanLimits(feature) {
  return async (req, res, next) => {
    try {
      const plan = await getUserPlan(req.user.id);

      if (feature && !plan.features.includes(feature) && !plan.features.includes('all')) {
        return res.status(403).json({
          error: `Feature '${feature}' not available on your current plan`,
          required_plan: getRequiredPlan(feature)
        });
      }

      req.userPlan = plan;
      next();
    } catch (error) {
      console.error('Check plan limits error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

function checkUserLimit() {
  return async (req, res, next) => {
    try {
      const plan = await getUserPlan(req.user.id);

      if (plan.max_users === -1) {
        req.userPlan = plan;
        return next();
      }

      const result = await pool.query(
        "SELECT COUNT(*) as count FROM users WHERE is_active = true"
      );

      const currentCount = parseInt(result.rows[0].count);

      if (currentCount >= plan.max_users) {
        return res.status(403).json({
          error: 'User limit reached for your plan',
          current: currentCount,
          limit: plan.max_users,
          upgrade_required: true
        });
      }

      req.userPlan = plan;
      next();
    } catch (error) {
      console.error('Check user limit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

function checkProductLimit() {
  return async (req, res, next) => {
    try {
      const plan = await getUserPlan(req.user.id);

      if (plan.max_products === -1) {
        req.userPlan = plan;
        return next();
      }

      const result = await pool.query(
        "SELECT COUNT(*) as count FROM products WHERE is_active = true"
      );

      const currentCount = parseInt(result.rows[0].count);

      if (currentCount >= plan.max_products) {
        return res.status(403).json({
          error: 'Product limit reached for your plan',
          current: currentCount,
          limit: plan.max_products,
          upgrade_required: true
        });
      }

      req.userPlan = plan;
      next();
    } catch (error) {
      console.error('Check product limit error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

function enforceLimits() {
  return async (req, res, next) => {
    try {
      const plan = await getUserPlan(req.user.id);
      req.userPlan = plan;

      if (plan.max_users !== -1) {
        const userCount = await pool.query("SELECT COUNT(*) as count FROM users WHERE is_active = true");
        if (parseInt(userCount.rows[0].count) >= plan.max_users) {
          return res.status(403).json({ error: 'User limit reached', upgrade_required: true });
        }
      }

      if (plan.max_products !== -1) {
        const productCount = await pool.query("SELECT COUNT(*) as count FROM products WHERE is_active = true");
        if (parseInt(productCount.rows[0].count) >= plan.max_products) {
          return res.status(403).json({ error: 'Product limit reached', upgrade_required: true });
        }
      }

      next();
    } catch (error) {
      console.error('Enforce limits error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };
}

function getRequiredPlan(feature) {
  const featurePlans = {
    email_notifications: 'starter',
    integrations: 'professional',
    reports: 'professional',
    priority_support: 'enterprise',
    custom_features: 'enterprise'
  };
  return featurePlans[feature] || 'professional';
}

module.exports = { checkPlanLimits, checkUserLimit, checkProductLimit, enforceLimits, getUserPlan };
