const pool = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const orgSlug = req.headers['x-organization-slug'] 
                 || req.user?.organizationSlug;
    
    if (!orgSlug) {
      return res.status(400).json({ error: 'Organization required' });
    }

    const { rows } = await pool.query(
      'SELECT id, name, plan_id FROM organizations WHERE slug=$1 AND is_active=true',
      [orgSlug]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Organization not found or inactive' });
    }

    req.organizationId = rows[0].id;
    req.organizationName = rows[0].name;
    req.organizationPlanId = rows[0].plan_id;
    next();
  } catch (err) {
    console.error('Tenant middleware error:', err.message);
    res.status(500).json({ error: 'Internal server error' });
  }
};
