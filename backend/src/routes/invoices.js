const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { validate, validateRequest, invoiceSchema } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

router.use(auth);

router.get('/', cacheMiddleware(120), pagination, async (req, res, next) => {
  try {
    const { type, status, search } = req.query;
    const { limit, offset } = req.pagination;
    let query = `
      SELECT i.*,
        c.first_name || ' ' || c.last_name as contact_name,
        c.company as contact_company
      FROM invoices i
      LEFT JOIN contacts c ON i.contact_id = c.id
    `;
    let countQuery = 'SELECT COUNT(*) FROM invoices i';
    const params = [];
    const countParams = [];
    const conditions = [];
    const countConditions = [];

    if (type) {
      params.push(type);
      countParams.push(type);
      conditions.push(`i.type = $${params.length}`);
      countConditions.push(`i.type = $${countParams.length}`);
    }

    if (status) {
      params.push(status);
      countParams.push(status);
      conditions.push(`i.status = $${params.length}`);
      countConditions.push(`i.status = $${countParams.length}`);
    }

    if (search) {
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      conditions.push(`(i.invoice_number ILIKE $${params.length} OR c.first_name ILIKE $${params.length} OR c.company ILIKE $${params.length})`);
      countConditions.push(`(i.invoice_number ILIKE $${countParams.length})`);
    }

    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }

    if (countConditions.length > 0) {
      countQuery += ' WHERE ' + countConditions.join(' AND ');
    }

    const countResult = await pool.query(countQuery, countParams);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    query += ' ORDER BY i.issue_date DESC LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/stats/summary', cacheMiddleware(120), async (req, res, next) => {
  try {
    const result = await pool.query(`
      SELECT
        type,
        COUNT(*) as count,
        SUM(total) as total_amount,
        SUM(paid_amount) as paid_amount,
        SUM(total - paid_amount) as pending_amount
      FROM invoices
      GROUP BY type
    `);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT i.*,
        c.first_name || ' ' || c.last_name as contact_name,
        c.company as contact_company,
        c.email as contact_email,
        c.address as contact_address
       FROM invoices i
       LEFT JOIN contacts c ON i.contact_id = c.id
       WHERE i.id = $1`,
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Invoice not found', 404);
    }

    const items = await pool.query(
      'SELECT * FROM invoice_items WHERE invoice_id = $1',
      [req.params.id]
    );

    res.json({ ...result.rows[0], items: items.rows });
  } catch (error) {
    next(error);
  }
});

router.post('/', invalidateCache('/invoices*'), validate(invoiceSchema), validateRequest, async (req, res, next) => {
  try {
    const { type, contact_id, status, issue_date, due_date, tax_rate, notes, items } = req.body;

    const invoiceNumber = `${type === 'invoice' ? 'INV' : 'PUR'}-${Date.now()}`;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (tax_rate / 100);
    const total = subtotal + taxAmount;

    await pool.query('BEGIN');

    const invoice = await pool.query(
      `INSERT INTO invoices (invoice_number, type, contact_id, status, issue_date, due_date, subtotal, tax_rate, tax_amount, total, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12) RETURNING *`,
      [invoiceNumber, type, contact_id, status, issue_date, due_date, subtotal, tax_rate, taxAmount, total, notes, req.user.id]
    );

    for (const item of items) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [invoice.rows[0].id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }

    await pool.query('COMMIT');

    res.status(201).json(invoice.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
});

router.put('/:id', invalidateCache('/invoices*'), validate(invoiceSchema), validateRequest, async (req, res, next) => {
  try {
    const { type, contact_id, status, issue_date, due_date, tax_rate, notes, items, paid_amount } = req.body;

    const subtotal = items.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
    const taxAmount = subtotal * (tax_rate / 100);
    const total = subtotal + taxAmount;

    await pool.query('BEGIN');

    const result = await pool.query(
      `UPDATE invoices SET type=$1, contact_id=$2, status=$3, issue_date=$4, due_date=$5,
       subtotal=$6, tax_rate=$7, tax_amount=$8, total=$9, notes=$10, paid_amount=$11, updated_at=CURRENT_TIMESTAMP
       WHERE id=$12 RETURNING *`,
      [type, contact_id, status, issue_date, due_date, subtotal, tax_rate, taxAmount, total, notes, paid_amount || 0, req.params.id]
    );

    if (result.rows.length === 0) {
      await pool.query('ROLLBACK');
      throw new AppError('Invoice not found', 404);
    }

    await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);

    for (const item of items) {
      await pool.query(
        `INSERT INTO invoice_items (invoice_id, description, quantity, unit_price, total)
         VALUES ($1, $2, $3, $4, $5)`,
        [req.params.id, item.description, item.quantity, item.unit_price, item.quantity * item.unit_price]
      );
    }

    await pool.query('COMMIT');

    res.json(result.rows[0]);
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
});

router.delete('/:id', invalidateCache('/invoices*'), async (req, res, next) => {
  try {
    await pool.query('DELETE FROM invoice_items WHERE invoice_id = $1', [req.params.id]);
    await pool.query('DELETE FROM invoices WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

module.exports = router;
