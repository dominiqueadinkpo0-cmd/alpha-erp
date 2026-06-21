const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { AppError } = require('../middleware/errorHandler');
const { cacheMiddleware } = require('../middleware/cache');

router.use(auth);

router.get('/financial', cacheMiddleware(300), async (req, res, next) => {
  try {
    const { start_date, end_date } = req.query;

    let dateFilter = '';
    const params = [];

    if (start_date && end_date) {
      params.push(start_date, end_date);
      dateFilter = `AND i.issue_date BETWEEN $1 AND $2`;
    }

    const revenue = await pool.query(`
      SELECT
        SUM(total) as total_revenue,
        SUM(paid_amount) as collected,
        SUM(total - paid_amount) as pending
      FROM invoices i
      WHERE type = 'invoice' ${dateFilter}
    `, params);

    const expenses = await pool.query(`
      SELECT
        SUM(amount) as total_expenses
      FROM expenses e
      WHERE 1=1 ${start_date && end_date ? 'AND date BETWEEN $1 AND $2' : ''}
    `, params);

    const byMonth = await pool.query(`
      SELECT
        DATE_TRUNC('month', issue_date) as month,
        SUM(CASE WHEN type = 'invoice' THEN total ELSE 0 END) as revenue,
        SUM(CASE WHEN type = 'purchase' THEN total ELSE 0 END) as purchases
      FROM invoices
      WHERE issue_date >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', issue_date)
      ORDER BY month
    `);

    const byCategory = await pool.query(`
      SELECT
        p.category_id,
        c.name as category,
        SUM(ii.total) as total
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.description LIKE '%' || p.name || '%'
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE i.type = 'invoice'
      GROUP BY p.category_id, c.name
      ORDER BY total DESC
    `);

    res.json({
      summary: {
        revenue: parseFloat(revenue.rows[0].total_revenue) || 0,
        collected: parseFloat(revenue.rows[0].collected) || 0,
        pending: parseFloat(revenue.rows[0].pending) || 0,
        expenses: parseFloat(expenses.rows[0].total_expenses) || 0,
        profit: (parseFloat(revenue.rows[0].total_revenue) || 0) - (parseFloat(expenses.rows[0].total_expenses) || 0)
      },
      monthly: byMonth.rows,
      by_category: byCategory.rows
    });
  } catch (error) {
    next(error);
  }
});

router.get('/inventory', cacheMiddleware(300), async (req, res, next) => {
  try {
    const products = await pool.query(`
      SELECT
        p.*,
        c.name as category_name,
        (p.quantity * p.cost) as stock_value,
        (p.quantity * p.price) as potential_revenue
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      ORDER BY p.quantity ASC
    `);

    const lowStock = await pool.query(`
      SELECT COUNT(*) as count,
             SUM(quantity * cost) as value
      FROM products
      WHERE is_active = true AND quantity <= min_quantity
    `);

    const byCategory = await pool.query(`
      SELECT
        c.name as category,
        COUNT(p.id) as product_count,
        SUM(p.quantity) as total_stock,
        SUM(p.quantity * p.cost) as stock_value
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
      GROUP BY c.name
      ORDER BY stock_value DESC
    `);

    const movements = await pool.query(`
      SELECT
        DATE_TRUNC('day', created_at) as date,
        type,
        SUM(quantity) as total_quantity
      FROM stock_movements
      WHERE created_at >= NOW() - INTERVAL '30 days'
      GROUP BY DATE_TRUNC('day', created_at), type
      ORDER BY date
    `);

    res.json({
      summary: {
        total_products: products.rows.length,
        total_stock_value: products.rows.reduce((sum, p) => sum + parseFloat(p.stock_value), 0),
        low_stock_count: parseInt(lowStock.rows[0].count),
        low_stock_value: parseFloat(lowStock.rows[0].value) || 0
      },
      by_category: byCategory.rows,
      recent_movements: movements.rows,
      low_stock_products: products.rows.filter(p => p.quantity <= p.min_quantity)
    });
  } catch (error) {
    next(error);
  }
});

router.get('/sales', cacheMiddleware(300), async (req, res, next) => {
  try {
    const { period } = req.query;
    const interval = period === 'year' ? '12 months' : '30 days';

    const topProducts = await pool.query(`
      SELECT
        p.name,
        p.sku,
        SUM(ii.quantity) as units_sold,
        SUM(ii.total) as revenue
      FROM invoice_items ii
      JOIN invoices i ON ii.invoice_id = i.id
      JOIN products p ON ii.description LIKE '%' || p.name || '%'
      WHERE i.type = 'invoice'
        AND i.issue_date >= NOW() - INTERVAL '${interval}'
      GROUP BY p.id, p.name, p.sku
      ORDER BY revenue DESC
      LIMIT 10
    `);

    const topCustomers = await pool.query(`
      SELECT
        c.first_name || ' ' || c.last_name as name,
        c.company,
        COUNT(i.id) as orders,
        SUM(i.total) as total_spent
      FROM invoices i
      JOIN contacts c ON i.contact_id = c.id
      WHERE i.type = 'invoice'
        AND i.issue_date >= NOW() - INTERVAL '${interval}'
      GROUP BY c.id, c.first_name, c.last_name, c.company
      ORDER BY total_spent DESC
      LIMIT 10
    `);

    const salesByDay = await pool.query(`
      SELECT
        DATE_TRUNC('day', issue_date) as date,
        COUNT(*) as orders,
        SUM(total) as revenue
      FROM invoices
      WHERE type = 'invoice'
        AND issue_date >= NOW() - INTERVAL '${interval}'
      GROUP BY DATE_TRUNC('day', issue_date)
      ORDER BY date
    `);

    res.json({
      top_products: topProducts.rows,
      top_customers: topCustomers.rows,
      daily_sales: salesByDay.rows
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
