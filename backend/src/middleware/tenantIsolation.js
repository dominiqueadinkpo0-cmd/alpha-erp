const pool = require('../config/database');

/**
 * Tenant Isolation Middleware
 * Extracts organization_id from JWT and attaches to request.
 * Must run AFTER auth middleware.
 */
function tenantIsolation(req, res, next) {
  if (!req.user || !req.user.organization_id) {
    return res.status(401).json({ error: 'Authentication required with organization context' });
  }
  req.organizationId = req.user.organization_id;
  next();
}

/**
 * Creates a scoped query function that automatically adds organization_id filter.
 * Usage: const query = scopedQuery(req.organizationId);
 *        const result = await query('SELECT * FROM products WHERE is_active = true');
 */
function scopedQuery(organizationId) {
  return async (text, params = []) => {
    // Insert organization_id as the first parameter
    const scopedText = text.replace(
      /WHERE\b/i,
      `WHERE organization_id = $1 AND`
    );
    const scopedParams = [organizationId, ...params];
    return pool.query(scopedText, scopedParams);
  };
}

/**
 * Wraps a route handler to ensure tenant isolation.
 * Automatically injects organization_id into queries.
 */
function withTenant(handler) {
  return async (req, res, next) => {
    try {
      req.scopedQuery = scopedQuery(req.organizationId);
      await handler(req, res, next);
    } catch (error) {
      next(error);
    }
  };
}

/**
 * Helper: adds organization_id to INSERT queries.
 */
function addOrganizationId(organizationId, data) {
  return { ...data, organization_id: organizationId };
}

/**
 * Helper: creates a WHERE clause for organization filtering.
 * Use this for complex queries where simple replacement won't work.
 */
function orgFilter(organizationId, alias = '') {
  const prefix = alias ? `${alias}.` : '';
  return `${prefix}organization_id = $1`;
}

module.exports = {
  tenantIsolation,
  scopedQuery,
  withTenant,
  addOrganizationId,
  orgFilter
};
