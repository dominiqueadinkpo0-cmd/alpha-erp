const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { cacheMiddleware } = require('../middleware/cache');

router.use(auth);

router.get('/stats', cacheMiddleware(60), async (req, res, next) => {
  try {
    const [products, contacts, projects, invoices, employees] = await Promise.all([
      pool.query('SELECT COUNT(*) as count, SUM(quantity * cost) as total_value FROM products WHERE is_active = true'),
      pool.query('SELECT COUNT(*) as count FROM contacts WHERE is_active = true'),
      pool.query("SELECT COUNT(*) as count FROM projects WHERE status != 'completed'"),
      pool.query('SELECT type, COUNT(*) as count, SUM(total) as total FROM invoices GROUP BY type'),
      pool.query("SELECT COUNT(*) as count FROM employees WHERE status = 'active'")
    ]);

    const lowStock = await pool.query(
      'SELECT COUNT(*) as count FROM products WHERE is_active = true AND quantity <= min_quantity'
    );

    const recentProjects = await pool.query(`
      SELECT p.*,
        c.first_name || ' ' || c.last_name as client_name
      FROM projects p
      LEFT JOIN contacts c ON p.client_id = c.id
      ORDER BY p.updated_at DESC
      LIMIT 5
    `);

    const pendingInvoices = await pool.query(`
      SELECT i.*,
        c.first_name || ' ' || c.last_name as contact_name
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
      WHERE i.status = 'pending'
      ORDER BY i.due_date ASC
      LIMIT 5
    `);

    const monthlyRevenue = await pool.query(`
      SELECT
        DATE_TRUNC('month', issue_date) as month,
        SUM(total) as revenue
      FROM invoices
      WHERE type = 'invoice'
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY month DESC
      LIMIT 12
    `);

    res.json({
      products: {
        count: parseInt(products.rows[0].count),
        total_value: parseFloat(products.rows[0].total_value) || 0
      },
      contacts: { count: parseInt(contacts.rows[0].count) },
      projects: { active: parseInt(projects.rows[0].count) },
      employees: { count: parseInt(employees.rows[0].count) },
      low_stock: parseInt(lowStock.rows[0].count),
      invoices: invoices.rows.reduce((acc, row) => {
        acc[row.type] = { count: parseInt(row.count), total: parseFloat(row.total) };
        return acc;
      }, {}),
      recent_projects: recentProjects.rows,
      pending_invoices: pendingInvoices.rows,
      monthly_revenue: monthlyRevenue.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
