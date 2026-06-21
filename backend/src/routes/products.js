const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { auth } = require('../middleware/auth');
const { validate, validateRequest, productSchema } = require('../middleware/validate');
const { AppError } = require('../middleware/errorHandler');
const pagination = require('../middleware/pagination');
const { cacheMiddleware, invalidateCache } = require('../middleware/cache');

router.use(auth);

router.get('/', cacheMiddleware(120), pagination, async (req, res, next) => {
  try {
    const { search, category, low_stock } = req.query;
    const { limit, offset } = req.pagination;
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
      WHERE p.is_active = true
    `;
    let countQuery = 'SELECT COUNT(*) FROM products p WHERE p.is_active = true';
    const params = [];
    const countParams = [];

    if (search) {
      params.push(`%${search}%`);
      countParams.push(`%${search}%`);
      const cond = ` AND (p.name ILIKE $${params.length} OR p.sku ILIKE $${params.length})`;
      query += cond;
      countQuery += cond;
    }

    if (category) {
      params.push(category);
      countParams.push(category);
      query += ` AND p.category_id = $${params.length}`;
      countQuery += ` AND p.category_id = $${countParams.length}`;
    }

    if (low_stock === 'true') {
      query += ' AND p.quantity <= p.min_quantity';
      countQuery += ' AND p.quantity <= p.min_quantity';
    }

    const countResult = await pool.query(countQuery, countParams);
    res.setHeader('X-Total-Count', countResult.rows[0].count);

    query += ' ORDER BY p.name LIMIT $' + (params.length + 1) + ' OFFSET $' + (params.length + 2);
    params.push(limit, offset);

    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/categories', cacheMiddleware(120), async (req, res, next) => {
  try {
    const result = await pool.query('SELECT * FROM categories WHERE type = $1 ORDER BY name', ['product']);
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const result = await pool.query(
      'SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id WHERE p.id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.post('/', invalidateCache('/products*'), validate(productSchema), validateRequest, async (req, res, next) => {
  try {
    const { name, sku, description, category_id, price, cost, quantity, min_quantity, unit } = req.body;

    const result = await pool.query(
      `INSERT INTO products (name, sku, description, category_id, price, cost, quantity, min_quantity, unit)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *`,
      [name, sku, description, category_id, price, cost, quantity, min_quantity, unit]
    );

    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', invalidateCache('/products*'), validate(productSchema), validateRequest, async (req, res, next) => {
  try {
    const { name, sku, description, category_id, price, cost, quantity, min_quantity, unit } = req.body;

    const result = await pool.query(
      `UPDATE products SET name=$1, sku=$2, description=$3, category_id=$4, price=$5, cost=$6,
       quantity=$7, min_quantity=$8, unit=$9, updated_at=CURRENT_TIMESTAMP
       WHERE id=$10 RETURNING *`,
      [name, sku, description, category_id, price, cost, quantity, min_quantity, unit, req.params.id]
    );

    if (result.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    res.json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', invalidateCache('/products*'), async (req, res, next) => {
  try {
    await pool.query('UPDATE products SET is_active = false WHERE id = $1', [req.params.id]);
    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/stock', invalidateCache('/products*'), async (req, res, next) => {
  try {
    const { type, quantity, reference, notes } = req.body;

    const product = await pool.query('SELECT * FROM products WHERE id = $1', [req.params.id]);
    if (product.rows.length === 0) {
      throw new AppError('Product not found', 404);
    }

    const newQuantity = type === 'in'
      ? product.rows[0].quantity + quantity
      : product.rows[0].quantity - quantity;

    if (newQuantity < 0) {
      throw new AppError('Insufficient stock', 400);
    }

    await pool.query('BEGIN');

    await pool.query(
      'UPDATE products SET quantity = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
      [newQuantity, req.params.id]
    );

    await pool.query(
      'INSERT INTO stock_movements (product_id, type, quantity, reference, notes, user_id) VALUES ($1, $2, $3, $4, $5, $6)',
      [req.params.id, type, quantity, reference, notes, req.user.id]
    );

    await pool.query('COMMIT');

    res.json({ message: 'Stock updated', new_quantity: newQuantity });
  } catch (error) {
    await pool.query('ROLLBACK');
    next(error);
  }
});

router.get('/:id/movements', async (req, res, next) => {
  try {
    const result = await pool.query(
      `SELECT sm.*, u.first_name || ' ' || u.last_name as user_name
       FROM stock_movements sm
       LEFT JOIN users u ON sm.user_id = u.id
       WHERE sm.product_id = $1
       ORDER BY sm.created_at DESC
       LIMIT 50`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
